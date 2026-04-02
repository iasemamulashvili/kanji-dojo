import { supabase } from '@/lib/supabase';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export async function checkAndAnnounceWinner(sessionId: string) {
  try {
    // 1. Fetch current session and participants
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*, quiz_participants(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.notified) return;

    const participants = session.quiz_participants || [];
    if (participants.length === 0) return;

    // 2. Check competition status
    let totalPlayers = participants.length;
    try {
      const chatMemberCount = await bot.telegram.getChatMembersCount(process.env.TELEGRAM_GROUP_ID!);
      totalPlayers = Math.max(1, chatMemberCount - 1); // Subtract the bot itself
    } catch (e) {
      console.warn("Could not get chat member count, falling back to 1", e);
    }
    
    // allFinished requires all participants to be finished AND that everyone in the group has participated
    const allFinished = participants.length >= totalPlayers && participants.every((p: any) => p.finished);
    const isExpired = new Date(session.expires_at).getTime() < Date.now();

    // ONLY announce if everyone is done OR the 24-hour window is closed
    if (!allFinished && !isExpired) {
      const timeLeft = Math.max(0, new Date(session.expires_at).getTime() - Date.now());
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      
      // Optional: Inform the group that results are pending
      await bot.telegram.sendMessage(process.env.TELEGRAM_GROUP_ID!, 
        `⏱️ *Quiz Entry Logged!* \nCompetition remains open for *${hours}h* more or until all participants finish.`, 
        { parse_mode: 'Markdown' });
      return;
    }

    // 3. Find the leader
    const leader = [...participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const timeA = new Date(a.finished_at || 0).getTime() || Infinity;
      const timeB = new Date(b.finished_at || 0).getTime() || Infinity;
      return timeA - timeB;
    })[0];

    if (!leader || !leader.finished) return;

    const groupId = process.env.TELEGRAM_GROUP_ID;
    if (!groupId) return;

    // 4. Final Broadcast
    const medal = allFinished ? "🏆" : "⌛";
    const title = allFinished ? "Dojo Champion Crowned!" : "Time's Up! Dojo Results:";
    
    const displayUsername = leader.username || `Player ${leader.telegram_id?.toString().slice(-4) || 'Unknown'}`;
    
    const message = `
${medal} *${title}* ${medal}
---------------------------
*Winner:* ${displayUsername}
*Score:* ${leader.score} / ${participants[0]?.total_questions || '??'}

Congrats to the winner! The session is now closed.
    `.trim();

    await bot.telegram.sendMessage(groupId, message, { parse_mode: 'Markdown' });
    
    // Mark session as notified/closed
    await supabase.from('quiz_sessions').update({ 
      status: 'finished', 
      notified: true 
    }).eq('id', sessionId);

  } catch (err) {
    console.error('Error in checkAndAnnounceWinner:', err);
  }
}
