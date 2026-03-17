import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { askTutor } from '../ai/tutor';
import { signTelegramToken } from '../auth/jwt';

// Initialize Supabase Client for bot interactions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for the bot!');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ensure the group_settings row exists on startup
async function initDatabase() {
  const { data, error } = await supabase.from('group_settings').select('*').single();
  if (!data) {
    console.log("[Bot Init] No row found in group_settings. Creating...");
    await supabase.from('group_settings').insert({});
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

  try {
    // Send a typing indicator to UX
    await ctx.sendChatAction('typing');
    
    // Process query using Gemini
    const response = await askTutor(query);
    
    return ctx.reply(response);
  } catch (error) {
    console.error('Error handling /ask command:', error);
    return ctx.reply("Sensei is currently meditating. Please try asking again later.");
  }
});

bot.command('help', async (ctx) => {
  const helpMessage = `📜 *Dojo Commands*
  
/practice - ⛩️ Enter the Dojo
/quiz - 🧠 Random Kanji Quiz
/ask - 🏮 Ask Sensei a question
/next - ⏭️ Suggest moving to next Kanji
/prev - ⏮️ Suggest moving to previous Kanji
/help - 📜 Show this scroll`;

  await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
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
    const quizUrl = `${baseUrl}/api/auth/verify?token=${token}&redirect=/practice?mode=quiz`;

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
  await ctx.reply(
    "Move to the next Kanji? (Need 1 more confirmation)",
    Markup.inlineKeyboard([Markup.button.callback('✅ Confirm Next', 'confirm_next')])
  );
});

bot.command('prev', async (ctx) => {
  await ctx.reply(
    "Return to previous Kanji? (Need 1 more confirmation)",
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

    // 2. Fetch all sorted kanjis to determine index
    const { data: allKanjis } = await supabase
      .from('kanjis')
      .select('id, character')
      .order('jlpt_level', { ascending: false })
      .order('stroke_count', { ascending: true });

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
