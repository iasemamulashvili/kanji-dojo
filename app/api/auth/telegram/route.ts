import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { signTelegramToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Parse and validate the initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return NextResponse.json({ error: 'Invalid initData structure (missing hash)' }, { status: 400 });
    }

    // Remove hash to construct the data check string
    urlParams.delete('hash');
    
    // Sort keys alphabetically
    const keys = Array.from(urlParams.keys()).sort();
    
    // Construct the check string
    const dataCheckString = keys.map(key => `${key}=${urlParams.get(key)}`).join('\n');

    // Calculate cryptographic signature
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // 2. Validate the hash
    if (calculatedHash !== hash) {
      console.error('Telegram initData validation failed: Signature mismatch');
      return NextResponse.json({ error: 'Access Denied: Invalid signature' }, { status: 403 });
    }

    // 3. Extract the Telegram user ID
    const userStr = urlParams.get('user');
    if (!userStr) {
      return NextResponse.json({ error: 'Invalid initData structure (missing user)' }, { status: 400 });
    }

    const user = JSON.parse(userStr);
    const telegramId = user.id?.toString();

    if (!telegramId) {
      return NextResponse.json({ error: 'Could not extract telegram ID' }, { status: 400 });
    }

    // 4. Sign a JWT and set it as an HTTP-only cookie
    const token = await signTelegramToken(telegramId);
    
    const response = NextResponse.json({ success: true, telegramId });
    
    response.cookies.set({
      name: 'dojo_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error in /api/auth/telegram:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
