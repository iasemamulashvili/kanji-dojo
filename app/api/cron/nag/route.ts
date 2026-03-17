import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!botToken || !groupId) {
    console.error({
      botTokenExists: !!botToken,
      groupIdExists: !!groupId,
    });
    return new NextResponse("Missing env vars", { status: 500 });
  }

  const bot = new Telegraf(botToken);

  try {
    const urgencies = [
      "Sensei is watching...",
      "The sun climbs higher...",
      "Your streak awaits validation..."
    ];
    const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];

    const message = `🥋 <b>${urgency}</b>\n\nThe Dojo is open. Don't let your streak slip away!\n\n<a href='${process.env.APP_URL}/practice'>Continue Training</a>`;

    await bot.telegram.sendMessage(groupId, message, { parse_mode: 'HTML' });

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
