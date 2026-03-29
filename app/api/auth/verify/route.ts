import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramToken } from '../../../../lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing token', { status: 400 });
  }

  try {
    const payload = await verifyTelegramToken(token);
    const telegramId = payload.telegramId as string;

    if (!telegramId) {
      throw new Error('Invalid payload: Missing telegramId');
    }

    const cookieStore = await cookies();
    cookieStore.set('dojo_session', token, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const baseUrl = process.env.APP_URL || req.nextUrl.origin;
    const redirectPath = req.nextUrl.searchParams.get('redirect') || '/practice';
    return NextResponse.redirect(new URL(redirectPath, baseUrl));
  } catch (error) {
    return new NextResponse('Invalid or expired token', { status: 401 });
  }
}
