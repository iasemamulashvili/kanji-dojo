import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { askTutor } from '../ai/tutor';
import { signTelegramToken } from '../auth/jwt';
import { broadcastNextKanji } from '../game-logic/broadcast';
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
  const helpMessage = `📜 <b>Dojo Commands</b>

/today - 📅 Show today's Kanji (works offline)
/practice - ⛩️ Enter the Dojo
/quiz - 🧠 Random Kanji Quiz
/ask - <a href="tg://msg?text=/ask%20">🏮 Start asking</a>
/next - ⏭️ Vote to skip to next Kanji
/prev - ⏮️ Go to previous Kanji
/help - 📜 Show this scroll`;

  await ctx.reply(helpMessage, { parse_mode: 'HTML' });
});

bot.command('today', async (ctx) => {
  try {
    // Use the env GROUP_ID as the authoritative group — works in group and private chats
    const groupId = process.env.TELEGRAM_GROUP_ID;
    if (!groupId) {
      await ctx.reply('⚠️ Sensei cannot find the Dojo group configuration.');
      return;
    }

    // Fetch the current kanji_id from group_settings
    const { data: settings, error: settingsError } = await supabase
      .from('group_settings')
      .select('current_kanji_id')
      .eq('group_id', Number(groupId))
      .maybeSingle();

    let kanjiId = settings?.current_kanji_id;
    let isFallback = false;

    if (settingsError || !kanjiId) {
      const { data: firstKanjis } = await supabase
        .from('kanjis')
        .select('id')
        .order('jlpt_order', { ascending: true })
        .limit(1);
        
      if (!firstKanjis || firstKanjis.length === 0) {
        await ctx.reply('⚠️ Sensei could not find any Kanji in the curriculum.');
        return;
      }
      kanjiId = firstKanjis[0].id;
      isFallback = true;
    }

    // Fetch the full kanji record
    const { data: kanji, error: kanjiError } = await supabase
      .from('kanjis')
      .select('character, meanings, onyomi, kunyomi, jlpt_level, stroke_count, grammar_explanation')
      .eq('id', kanjiId)
      .single();

    if (kanjiError || !kanji) {
      await ctx.reply('⚠️ Sensei could not retrieve today\'s Kanji. Please try again shortly.');
      return;
    }

    const meanings = Array.isArray(kanji.meanings)
      ? kanji.meanings.join(' • ')
      : (kanji.meanings || 'Unknown');
    const onyomi = Array.isArray(kanji.onyomi)
      ? kanji.onyomi.join('、')
      : (kanji.onyomi || '—');
    const kunyomi = Array.isArray(kanji.kunyomi)
      ? kanji.kunyomi.join('、')
      : (kanji.kunyomi || '—');
    const jlptBadge = kanji.jlpt_level ? `N${kanji.jlpt_level}` : '—';
    const strokes = kanji.stroke_count ?? '?';

    // Escape special MarkdownV2 chars in dynamic content
    const escMd = (s: string) => s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

    const headerTitle = isFallback ? "🏯 *Beginning of Curriculum*" : "🏯 *Today's Kanji*";
    const message =
`${headerTitle}
━━━━━━━━━━━━━━━━━━

*${escMd(kanji.character)}*

📖 *Meaning:* ${escMd(meanings)}
🔊 *On'yomi:* ${escMd(onyomi)}
🌿 *Kun'yomi:* ${escMd(kunyomi)}
🎌 *JLPT:* ${escMd(jlptBadge)} · ${escMd(String(strokes))} strokes${kanji.grammar_explanation ? `\n\n📝 *Notes:*\n${escMd(kanji.grammar_explanation)}` : ''}

━━━━━━━━━━━━━━━━━━
_Memorize this scroll — it works offline\\!_`;

    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
  } catch (err) {
    console.error('[Today Command Error]:', err);
    await ctx.reply('A sudden wind scattered the scrolls. Please try again.');
  }
});

bot.command('practice', async (ctx) => {
  try {
    console.log("[Bot] /practice command triggered by user:", ctx.from?.id);
    if (!ctx.from?.id) {
      return;
    }

    const token = await signTelegramToken(ctx.from.id.toString());
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const practiceUrl = `${baseUrl}/api/auth/verify?token=${token}`;

    await ctx.reply(
      "Your training space is ready, Sensei is waiting.",
      Markup.inlineKeyboard([Markup.button.url('⛩️ Enter Dojo', practiceUrl)])
    );
  } catch (error) {
    console.error("[Practice Command Error]:", error);
    await ctx.reply("Sensei tripped over a tatami mat. Please try again.");
  }
});

bot.command('quiz', async (ctx) => {
  try {
    console.log("[Bot] /quiz command triggered by user:", ctx.from?.id);
    if (!ctx.from?.id) {
      return;
    }

    const token = await signTelegramToken(ctx.from.id.toString());
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const quizUrl = `${baseUrl}/api/auth/verify?token=${token}&redirect=/api/quiz/start`;

    await ctx.reply(
      "Sensei is testing your memory.",
      Markup.inlineKeyboard([Markup.button.url('🧠 Start Quiz', quizUrl)])
    );
  } catch (error) {
    console.error("[Quiz Command Error]:", error);
    await ctx.reply("Sensei tripped over a tatami mat. Please try again.");
  }
});

bot.command('next', async (ctx) => {
  try {
    const telegramId = ctx.from?.id;
    const groupId = ctx.chat?.id;

    if (!telegramId) return;

    // 1. Fetch current active Kanji's jlpt_order directly
    let currentJlptOrder = 0;

    if (groupId) {
      const { data: settings } = await supabase
        .from('group_settings')
        .select('current_kanji_id')
        .eq('group_id', Number(groupId))
        .maybeSingle();

      if (settings?.current_kanji_id) {
        const { data: currentKanji } = await supabase
          .from('kanjis')
          .select('jlpt_order')
          .eq('id', settings.current_kanji_id)
          .single();

        if (currentKanji?.jlpt_order) {
          currentJlptOrder = currentKanji.jlpt_order;
        }
      }
    }

    if (!currentJlptOrder) {
      currentJlptOrder = 1;
    }

    // 2. Insert vote (uses the true jlpt_order integer)
    const { error: insertError } = await supabase
      .from('kanji_votes')
      .insert({
        current_jlpt_order: currentJlptOrder,
        voter_telegram_id: telegramId
      });

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        await ctx.reply("You have already voted to skip this Kanji.");
      } else {
        console.error("Vote Insert Error:", insertError);
        await ctx.reply("Sensei's brush slipped. Could not record your vote.");
      }
      return;
    }

    // 3. Count total votes
    const { count, error: countError } = await supabase
      .from('kanji_votes')
      .select('*', { count: 'exact', head: true })
      .eq('current_jlpt_order', currentJlptOrder);

    if (countError) {
      console.error("Vote Count Error:", countError);
      return;
    }

    const totalVotes = count || 0;
    const memberCount = await ctx.getChatMembersCount().catch(() => 2);
    const QUORUM = Math.max(1, memberCount - 1);

    if (totalVotes < QUORUM) {
      await ctx.reply(`Vote registered! [${totalVotes}/${QUORUM}] votes to skip to the next Kanji.`);
    } else {
      await ctx.reply("Vote passed! Skipping to the next Kanji...");
      // Trigger the broadcast — broadcastNextKanji uses jlpt_order internally
      await broadcastNextKanji('vote');
    }
  } catch (err) {
    console.error("Error in /next command:", err);
    await ctx.reply("A mystical wind disturbed the Dojo. Try again later.");
  }
});

bot.command('prev', async (ctx) => {
  const groupId = ctx.chat?.id;
  if (groupId) {
    const { data: settings } = await supabase
      .from('group_settings')
      .select('current_kanji_id')
      .eq('group_id', Number(groupId))
      .maybeSingle();

    let currentJlptOrder = 0;
    if (settings?.current_kanji_id) {
      const { data: currentKanji } = await supabase
        .from('kanjis')
        .select('jlpt_order')
        .eq('id', settings.current_kanji_id)
        .single();
      if (currentKanji?.jlpt_order) {
        currentJlptOrder = currentKanji.jlpt_order;
      }
    }

    const { data: firstKanjis } = await supabase
      .from('kanjis')
      .select('jlpt_order')
      .order('jlpt_order', { ascending: true })
      .limit(1);

    const firstOrder = firstKanjis?.[0]?.jlpt_order ?? 1;

    if (currentJlptOrder === 0 || currentJlptOrder === firstOrder) {
      await ctx.reply("Sensei says: You are already at the beginning of the path. No previous Kanji available.");
      return;
    }
  }

  const memberCount = await ctx.getChatMembersCount().catch(() => 2);
  const QUORUM = Math.max(1, memberCount - 1);

  await ctx.reply(
    `Return to previous Kanji? (Requires ${QUORUM} confirmation${QUORUM !== 1 ? 's' : ''})`,
    Markup.inlineKeyboard([Markup.button.callback('✅ Confirm Previous', 'confirm_prev')])
  );
});

console.log('[Bot] Registering confirm_next action listener');
bot.action('confirm_next', async (ctx) => {
  console.log('[Bot] Callback received:', ctx.match);
  await handleNavigation(ctx, 1);
});

console.log('[Bot] Registering confirm_prev action listener');
bot.action('confirm_prev', async (ctx) => {
  console.log('[Bot] Callback received:', ctx.match);
  await handleNavigation(ctx, -1);
});

async function handleNavigation(ctx: any, direction: number) {
  try {
    const groupId = ctx.chat?.id;
    if (!groupId) return;

    // 1. Fetch current group settings
    const { data: settings } = await supabase
      .from('group_settings')
      .select('*')
      .single();

    // 2. Fetch all kanjis ordered strictly by jlpt_order (sequential curriculum)
    const { data: allKanjis } = await supabase
      .from('kanjis')
      .select('id, character, jlpt_order')
      .order('jlpt_order', { ascending: true });

    if (!allKanjis || allKanjis.length === 0) {
      await ctx.answerCbQuery("The Dojo is empty. No Kanji to study.");
      return;
    }

    let currentIndex = 0;
    if (settings?.current_kanji_id) {
      currentIndex = allKanjis.findIndex(k => k.id === settings.current_kanji_id);
      if (currentIndex === -1) currentIndex = 0;
    }

    // 3. Calculate new index
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) {
      await ctx.answerCbQuery("You've reached the beginning of the curriculum!");
      await ctx.editMessageText("Sensei says: You are already at the beginning of the path. No previous Kanji available.");
      return;
    }
    
    if (newIndex >= allKanjis.length) {
      await ctx.answerCbQuery("You've reached the end of the current curriculum!");
      await ctx.editMessageText("Sensei says: You have reached the end of the current curriculum! Excellent work.");
      return;
    }

    const newKanji = allKanjis[newIndex];

    // 4. Update or Insert group setting
    const { data: currentSettings } = await supabase.from('group_settings').select('*').single();

    let upsertError;
    if (currentSettings) {
      const { error } = await supabase
        .from('group_settings')
        .upsert({ 
          id: currentSettings.id,
          current_kanji_id: newKanji.id,
          updated_at: new Date().toISOString()
        });
      upsertError = error;
    } else {
      const { error } = await supabase
        .from('group_settings')
        .insert({
          current_kanji_id: newKanji.id
        });
      upsertError = error;
    }

    console.log('Update Result:', { error: upsertError, newId: newKanji.id });

    if (upsertError) {
      await ctx.editMessageText(`Sensei failed to update the scroll: ${upsertError.message || JSON.stringify(upsertError)}`);
      return;
    }

    // 5. Reply
    await ctx.answerCbQuery("Confirmed.");
    await ctx.editMessageText(`Sensei has updated the curriculum. The Dojo is now studying: ${newKanji.character}.`);
  } catch (error: any) {
    console.error("Navigation error:", error);
    await ctx.editMessageText(`Sensei failed to update the scroll: ${error?.message || "Internal Error"}`);
  }
}

export default bot;
