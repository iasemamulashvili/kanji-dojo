import { NextRequest, NextResponse } from 'next/server';
import { broadcastNextKanji } from '@/lib/game-logic/broadcast';

function validateAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

async function runMorningBroadcast(): Promise<NextResponse> {
  try {
    const result = await broadcastNextKanji('cron');
    if (result.skipped) {
      return new NextResponse(`Skipped: ${result.reason}`, { status: 200 });
    }
    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error('[Cron/Morning] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Called by Vercel Cron (GET, with Authorization header set by CRON_SECRET env)
export async function GET(req: NextRequest) {
  if (!validateAuth(req)) return new NextResponse('Unauthorized', { status: 401 });
  return runMorningBroadcast();
}

// Called by cron-job.org or any external scheduler (POST with Bearer token)
export async function POST(req: NextRequest) {
  if (!validateAuth(req)) return new NextResponse('Unauthorized', { status: 401 });
  return runMorningBroadcast();
}
