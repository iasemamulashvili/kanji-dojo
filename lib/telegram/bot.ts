import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { askTutor } from '../ai/tutor';
import { signTelegramToken } from '../auth/jwt';
import { broadcastNextKanji, broadcastPrevKanji } from '../game-logic/broadcast';
// Initialize Supabase Client for bot interactions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for the bot!');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ensure the group_settings row exists on startup (Singleton for the default group)
async function initDatabase() {
  const groupId = process.env.TELEGRAM_GROUP_ID;
  if (!groupId) return;

  const { data, error } = await supabase
    .from('group_settings')
    .select('*')
    .eq('group_id', Number(groupId))
    .maybeSingle();

  if (!data && !error) {
    console.log("[Bot Init] No row found in group_settings. Creating singleton...");
    const { data: firstKanji } = await supabase
      .from('kanjis')
      .select('id')
      .order('jlpt_order', { ascending: true })
      .limit(1)
      .single();

    if (firstKanji) {
      await supabase.from('group_settings').insert({
        group_id: Number(groupId),
        current_kanji_id: firstKanji.id
      });
    }
  }
}
initDatabase();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Welcome to Kanji Dojo! Your serverless bot is active.'));

bot.command('ask', async (ctx) => {
  const message = ctx.message;
  // Ensure the message has text
  if (!message || !('text' in message)) return;

  // Extract query after /ask
  const query = message.text.replace(/^\/ask(?:\s|$)/, '').trim();

  if (!query) {
    return ctx.reply("Sensei needs a question! Try: /ask How do I remember the Kanji for Water?");
  }

  // Immediately send a placeholder to satisfy the webhook timeout
  const pendingMsg = await ctx.reply("Sensei is consulting the scrolls... 📜");

  try {
    // Process query using Gemini
    const response = await askTutor(query);

    // Edit the placeholder with the real answer
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      pendingMsg.message_id,
      undefined,
      response
    );
  } catch (error) {
    console.error('Error handling /ask command:', error);
    // Edit the placeholder with a friendly error
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      pendingMsg.message_id,
      undefined,
      "Sorry, my mind is cloudy right now. Please try asking again."
    );
  }
});

bot.command('help', async (ctx) => {
  const helpMessage = `📜 *Dojo Commands*

/today - 📅 Today's Kanji (text-only)
/practice - ⛩️ Training Grounds
/quiz - 🧠 Test your knowledge
/stats - 📈 View your progress
/next - ⏭️ Vote to skip to next
/prev - ⏮️ Vote to go back
/help - 📜 This scroll`;

  await ctx.reply(helpMessage, { 
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      Markup.button.switchToCurrentChat('🏮 Ask Sensei', '/ask ')
    ])
  });
});

bot.command('today', async (ctx) => {
  try {
    const groupId = process.env.TELEGRAM_GROUP_ID;
    if (!groupId) return ctx.reply('⚠️ Configuration error.');

    const { data: settings } = await supabase
      .from('group_settings')
      .select('current_kanji_id')
      .eq('group_id', Number(groupId))
      .maybeSingle();

    let kanjiId = settings?.current_kanji_id;

    if (!kanjiId) {
      const { data: first } = await supabase.from('kanjis').select('id').order('jlpt_order', { ascending: true }).limit(1).single();
      kanjiId = first?.id;
    }

    if (!kanjiId) return ctx.reply('⚠️ No Kanji found.');

    const { data: kanji } = await supabase
      .from('kanjis')
      .select('character, meanings, onyomi, kunyomi')
      .eq('id', kanjiId)
      .single();

    if (!kanji) return ctx.reply('⚠️ Kanji not found.');

    const kanjiData = {
      character: kanji.character,
      meanings: Array.isArray(kanji.meanings) ? kanji.meanings.join(', ') : kanji.meanings,
      onyomi: Array.isArray(kanji.onyomi) ? kanji.onyomi.join(', ') : kanji.onyomi,
      kunyomi: Array.isArray(kanji.kunyomi) ? kanji.kunyomi.join(', ') : kanji.kunyomi,
    };

    // Store in middleman cache for offline resilience
    const { setCachedTodayKanji } = await import('./cache');
    setCachedTodayKanji(kanjiData);

    const message = `🏯 *Today's Kanji*
━━━━━━━━━━━━━━━━━━
*${kanjiData.character}*

📖 *Meaning:* ${kanjiData.meanings}
🔊 *Onyomi:* ${kanjiData.onyomi}
🌿 *Kunyomi:* ${kanjiData.kunyomi}
━━━━━━━━━━━━━━━━━━`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    try {
      // Attempt fallback to cache
      const { getCachedTodayKanji } = await import('./cache');
      const cached = getCachedTodayKanji();
      if (cached) {
        const message = `🏯 *Today's Kanji (Cached)*
━━━━━━━━━━━━━━━━━━
*${cached.character}*

📖 *Meaning:* ${cached.meanings}
🔊 *Onyomi:* ${cached.onyomi}
🌿 *Kunyomi:* ${cached.kunyomi}
━━━━━━━━━━━━━━━━━━`;
        return ctx.reply(message, { parse_mode: 'Markdown' });
      }
    } catch (cacheErr) {
      console.error('Cache fallback failed:', cacheErr);
    }
    await ctx.reply('⚠️ Error fetching Kanji.');
  }
});

bot.command('practice', async (ctx) => {
  try {
    if (!ctx.from?.id) return;
    const token = await signTelegramToken(ctx.from.id.toString());
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}&redirect=/practice`;

    await ctx.reply(
      "Your training space is ready, Sensei is waiting.",
      Markup.inlineKeyboard([Markup.button.url('⛩️ Open Magic Link', magicLink)])
    );
  } catch (error) {
    console.error(error);
    await ctx.reply("Failed to generate practice link.");
  }
});

bot.command('quiz', async (ctx) => {
  await ctx.reply("Sensei is testing your memory. Choose your depth:", 
    Markup.inlineKeyboard([
      [Markup.button.callback('8', 'quiz:8'), Markup.button.callback('13', 'quiz:13')],
      [Markup.button.callback('17', 'quiz:17'), Markup.button.callback('21', 'quiz:21')]
    ])
  );
});

bot.command('stats', async (ctx) => {
  try {
    if (!ctx.from?.id) return;
    const token = await signTelegramToken(ctx.from.id.toString());
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}&redirect=/stats`;

    await ctx.reply(
      "The scrolls show your progress, Sensei.",
      Markup.inlineKeyboard([Markup.button.url('📈 Open Magic Link', magicLink)])
    );
  } catch (error) {
    console.error(error);
    await ctx.reply("Failed to generate stats link.");
  }
});

// Unified Voting Logic
async function handleVote(ctx: any, direction: 'next' | 'prev') {
  try {
    const telegramId = ctx.from?.id;
    const groupId = Number(process.env.TELEGRAM_GROUP_ID);
    if (!telegramId || !groupId) return;

    // Fetch current state
    const { data: settings } = await supabase
      .from('group_settings')
      .select('current_kanji_id')
      .eq('group_id', groupId)
      .maybeSingle();

    if (!settings?.current_kanji_id) return ctx.reply("⚠️ No active Kanji.");

    const { data: currentKanji } = await supabase
      .from('kanjis')
      .select('jlpt_order')
      .eq('id', settings.current_kanji_id)
      .single();

    const currentOrder = currentKanji?.jlpt_order || 1;

    // Edge case for /prev
    if (direction === 'prev' && currentOrder === 1) {
      return ctx.reply("🏮 You are already at the beginning of the path.");
    }

    // Dynamic Quorum — Temporarily lowered to 1 for testing Phase 3
    const quorumCount = 1;

    // Record vote
    const { error: insertError } = await supabase
      .from('kanji_navigation_votes')
      .insert({
        group_id: groupId,
        voter_id: telegramId,
        direction: direction,
        target_order: currentOrder
      });

    if (insertError && insertError.code !== '23505') throw insertError;

    // Count votes
    const { count } = await supabase
      .from('kanji_navigation_votes')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('direction', direction)
      .eq('target_order', currentOrder);

    const votes = count || 0;

    if (votes >= quorumCount) {
      await ctx.reply(`Vote passed! [${votes}/${quorumCount}] Proceeding...`);
      // Clear votes for this target_order to avoid re-triggering
      await supabase.from('kanji_navigation_votes').delete().eq('target_order', currentOrder);
      
      if (direction === 'next') await broadcastNextKanji('vote');
      else await broadcastPrevKanji();
    } else {
      await ctx.reply(`Agree to ${direction.toUpperCase()} (${votes}/${quorumCount})`, 
        Markup.inlineKeyboard([Markup.button.callback('Agree', `vote:${direction}`)])
      );
    }
  } catch (err) {
    console.error(err);
    await ctx.reply("Sensei's brush slipped. Please try again.");
  }
}

bot.command('next', (ctx) => handleVote(ctx, 'next'));
bot.command('prev', (ctx) => handleVote(ctx, 'prev'));

bot.action(/vote:(next|prev)/, (ctx) => {
  const direction = ctx.match[1] as 'next' | 'prev';
  handleVote(ctx, direction);
});

// Implement quiz callback size selection with Wabi-Sabi themes and magic links
bot.action(/quiz:(\d+)/, async (ctx) => {
  const size = ctx.match[1];
  if (!ctx.from?.id) return;
  
  await ctx.answerCbQuery("Sensei is preparing your quiz...");
  
  const token = await signTelegramToken(ctx.from.id.toString());
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  // Standard magic link pattern: /api/auth/verify?token=...&redirect=...
  const magicLink = `${baseUrl}/api/auth/verify?token=${token}&redirect=/api/quiz/start?q=${size}`;
  
  const wabiSabiMsgs = [
    "🌸 The cherry blossoms fall, each a moment for reflection. Your quiz of " + size + " questions is ready.",
    "🎋 Like a bamboo grove in the wind, your mind must be flexible and strong. Begin your " + size + "-step journey.",
    "🍵 Wisdom is brewed slowly. Step into your testing chamber for " + size + " challenges.",
    "🏮 The lanterns are lit. The path to knowledge awaits your " + size + " correct steps."
  ];
  const msg = wabiSabiMsgs[Math.floor(Math.random() * wabiSabiMsgs.length)];
  
  await ctx.editMessageText(msg, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      Markup.button.url('⛩️ Enter Quiz', magicLink)
    ])
  });
});

export default bot;
