import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTelegramToken } from './lib/auth/jwt';

// Protected routes that require authentication
const protectedRoutes = ['/kanji', '/quiz', '/profile', '/settings', '/practice'];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route) || pathname === '/');

  if (!isProtected) {
    return NextResponse.next();
  }

  const tokenFromUrl = searchParams.get('token');
  const sessionToken = request.cookies.get('dojo_session')?.value;

  const activeToken = tokenFromUrl || sessionToken;

  if (activeToken) {
    try {
      const payload = await verifyTelegramToken(activeToken);
      
      if (!payload || !payload.telegramId) {
        throw new Error('Invalid token payload');
      }

      const response = NextResponse.next();
      
      // Persist session if it came from URL
      if (tokenFromUrl) {
        response.cookies.set({
          name: 'dojo_session',
          value: tokenFromUrl,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });
      }
      
      response.headers.set('x-telegram-id', payload.telegramId.toString());
      return response;
    } catch (error) {
      console.error('Middleware token verification failed:', error);
      // If token is invalid, clear it and redirect to access-denied
      const response = NextResponse.redirect(new URL('/access-denied', request.url));
      response.cookies.delete('dojo_session');
      return response;
    }
  }

  // Strictly block access if no token/session is present
  return NextResponse.redirect(new URL('/access-denied', request.url));
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
