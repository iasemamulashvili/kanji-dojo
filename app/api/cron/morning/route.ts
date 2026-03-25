import { NextRequest, NextResponse } from 'next/server';
import { broadcastNextKanji } from '@/lib/game-logic/broadcast';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await broadcastNextKanji('cron');

    if (result.skipped) {
      return new NextResponse(`Skipped: ${result.reason}`, { status: 200 });
    }

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
