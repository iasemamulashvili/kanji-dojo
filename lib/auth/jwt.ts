import { SignJWT, jwtVerify } from 'jose';

export async function signTelegramToken(telegramId: string, username?: string): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return new SignJWT({ telegramId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyTelegramToken(token: string): Promise<any> {
  // --- MOCK AUTH BYPASS FOR LOCAL DEV ---
  if (process.env.NODE_ENV === 'development' && token === 'mock-dev-token') {
    return { telegramId: 123456789, username: 'Mock User' };
  }
  // -------------------------------------

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const { payload } = await jwtVerify(token, secret);
  return payload;
}
