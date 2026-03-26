import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTelegramToken } from './lib/auth/jwt';

// Protected routes that require authentication
const protectedRoutes = ['/kanji', '/quiz', '/profile', '/settings'];

export async function middleware(request: NextRequest) {
  // --- DEVELOPER MASTER KEY ---
  // Bypass all auth logic in local development so the TelegramAuthProvider
  // can load and handle the mock bypass in the frontend instead.
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const { pathname, searchParams } = request.nextUrl;

  // Check if we match a protected route
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route) || pathname === '/');

  if (!isProtected) {
    return NextResponse.next();
  }

  // 1. Check for token in URL parameters
  const token = searchParams.get('token');
  
  // 2. Check for token in cookies
  const cookieToken = request.cookies.get('auth_token')?.value;
  const dojoSession = request.cookies.get('dojo_session')?.value;

  // 3. If standard Telegram ID string exists, bypass JWT check for /quiz routing
  if (dojoSession && !token && !cookieToken) {
    const response = NextResponse.next();
    response.headers.set('x-telegram-id', dojoSession);
    return response;
  }

  const activeToken = token || cookieToken;

  if (!activeToken) {
    // Redirect to Access Denied if no token is found
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  try {
    // 4. Verify the token
    const payload = await verifyTelegramToken(activeToken);
    
    if (!payload || !payload.telegramId) {
      throw new Error('Invalid token payload');
    }

    // 5. Create a response to allow the request
    const response = NextResponse.next();
    
    // 5. If using a URL token, set it as an HTTP-only cookie for future requests
    if (token) {
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      
      // Optionally remove the token from the URL to clean it up for the user
      // const url = new URL(request.url);
      // url.searchParams.delete('token');
      // return NextResponse.redirect(url);
    }
    
    // 6. Pass the User ID to downstream requests
    response.headers.set('x-telegram-id', payload.telegramId.toString());

    return response;
  } catch (error) {
    console.error('Middleware token verification failed:', error);
    // Invalid or expired token
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|access-denied).*)',
  ],
};
