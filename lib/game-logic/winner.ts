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

    if (sessionError || !session) return;

    // Guard: already announced — never double-post
    if ((session as any).notified) return;

    const participants: any[] = session.quiz_participants || [];
    if (participants.length === 0) return;

    // 2. Determine whether the deadline has passed.
    //    expires_at is set to 08:00 Tbilisi time when the session is created.
    const expiresAt = session.expires_at
      ? new Date(session.expires_at).getTime()
      : Date.now(); // treat missing value as already expired
    const isDeadlinePassed = Date.now() >= expiresAt;

    // 3. Determine whether all players have finished.
    //    We compare against getChatMembersCount so latecomers who never
    //    started also count as "not finished". Falls back to participant
    //    count only if the API call fails.
    let totalPlayers = participants.length;
    try {
      const chatMemberCount = await bot.telegram.getChatMembersCount(
        process.env.TELEGRAM_GROUP_ID!
      );
      totalPlayers = Math.max(1, chatMemberCount - 1); // exclude the bot
    } catch (e) {
      console.warn('Could not get chat member count, using participant count', e);
    }

    const allFinished =
      participants.length >= totalPlayers &&
      participants.every((p: any) => p.finished);

    // 4. Only announce if the deadline has passed OR everyone finished — not before
    if (!isDeadlinePassed && !allFinished) {
      return;
    }

    // 5. Rank participants: highest score wins; ties broken by earliest finish time
    const ranked = [...participants]
      .filter((p: any) => p.finished)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const tA = new Date(a.finished_at || 0).getTime() || Infinity;
        const tB = new Date(b.finished_at || 0).getTime() || Infinity;
        return tA - tB;
      });

    if (ranked.length === 0) {
      // Nobody finished — post a "no participants" message and close
      const groupId = process.env.TELEGRAM_GROUP_ID;
      if (groupId) {
        await bot.telegram.sendMessage(
          groupId,
          `⌛ *Time's up!*\nNo one completed the quiz before the deadline. The Dojo session is now closed.`,
          { parse_mode: 'Markdown' }
        );
      }
      await supabase
        .from('quiz_sessions')
        .update({ notified: true, is_active: false })
        .eq('id', sessionId);
      return;
    }

    const leader = ranked[0];
    const groupId = process.env.TELEGRAM_GROUP_ID;
    if (!groupId) return;

    // 6. Build the announcement
    const medal = allFinished ? '🏆' : '⌛';
    const title = allFinished ? 'Dojo Champion Crowned!' : "Time's Up! Dojo Results:";
    const displayUsername =
      leader.username || `Player ${leader.telegram_id?.toString().slice(-4) ?? 'Unknown'}`;

    // Build a mini scoreboard of finishers
    const scoreboard = ranked
      .map((p, i) => {
        const name = p.username || `Player ${p.telegram_id?.toString().slice(-4)}`;
        const prefix = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${prefix} *${name}* — ${p.score} pts`;
      })
      .join('\n');

    const message = `
${medal} *${title}* ${medal}
━━━━━━━━━━━━━━━━━━
${scoreboard}
━━━━━━━━━━━━━━━━━━
Congratulations to ${displayUsername}! The session is now closed.
    `.trim();

    await bot.telegram.sendMessage(groupId, message, { parse_mode: 'Markdown' });

    // 7. Mark session as notified and closed
    await supabase
      .from('quiz_sessions')
      .update({ notified: true, is_active: false })
      .eq('id', sessionId);

  } catch (err) {
    console.error('Error in checkAndAnnounceWinner:', err);
  }
}
