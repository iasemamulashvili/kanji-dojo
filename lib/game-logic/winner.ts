import { supabase } from '@/lib/supabase';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export async function checkAndAnnounceWinner(sessionId: string) {
  try {
    // 1. Fetch current participants and their scores
    const { data: participants, error: participantsError } = await supabase
      .from('quiz_participants')
      .select('telegram_id, username, score, finished, finished_at')
      .eq('session_id', sessionId);

    if (participantsError || !participants || participants.length === 0) return;

    // 2. Check if everyone is finished or if this is just a milestone?
    // We'll announce when: 
    // - All current participants are finished
    // - Or, if it's the 1st person to finish with 100%
    const allFinished = participants.every(p => p.finished);
    
    // 3. Find the leader
    const leader = [...participants].sort((a, b) => {
      // Primary: Score
      if (b.score !== a.score) return b.score - a.score;
      // Secondary: Finished At (earlier is better)
      const timeA = new Date(a.finished_at || 0).getTime() || Infinity;
      const timeB = new Date(b.finished_at || 0).getTime() || Infinity;
      return timeA - timeB;
    })[0];

    if (!leader || !leader.finished) return;

    // 4. Determine Group ID
    // We should ideally have group_id on the session.
    // Fallback to TELEGRAM_GROUP_ID environment variable
    const groupId = process.env.TELEGRAM_GROUP_ID;
    if (!groupId) return;

    // 5. Build stylized message
    // If all finished, it's the FINAL winner.
    // If not, it's the "Current Leader"
    const finishedIcon = allFinished ? "🏆" : "🔥";
    const statusText = allFinished ? "Final Winner" : "Current Leader";
    
    const message = `
${finishedIcon} *Dojo Quiz Results* ${finishedIcon}
---------------------------
*${statusText}:* ${leader.username || `Player ${leader.telegram_id.toString().slice(-4)}`}
*Score:* ${leader.score} / ${participants.length > 0 ? "Correct" : ""}

${allFinished ? "The competition in this session has concluded!" : "Waiting for other disciples to finish..."}
    `.trim();

    // Avoid duplicate announcements for the same session/winner/score combo
    // We could store it in session status, but let's keep it simple for now.
    if (allFinished) {
      await bot.telegram.sendMessage(groupId, message, { parse_mode: 'Markdown' });
      
      // Mark session as finished in DB
      await supabase.from('quiz_sessions').update({ status: 'finished' }).eq('id', sessionId);
    }

  } catch (err) {
    console.error('Error in checkAndAnnounceWinner:', err);
  }
}
