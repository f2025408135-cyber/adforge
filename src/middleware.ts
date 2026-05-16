import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/generate') ||
      pathname.startsWith('/campaigns') ||
      pathname.startsWith('/templates') ||
      pathname.startsWith('/brand-kits') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/api/campaigns') ||
      pathname.startsWith('/api/brand-kits') ||
      pathname.startsWith('/api/templates') ||
      pathname.startsWith('/api/analytics')) {

    if (pathname.startsWith('/api/auth') || pathname === '/api/health') {
      return NextResponse.next();
    }

    const token = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');

    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/generate/:path*',
    '/campaigns/:path*',
    '/templates/:path*',
    '/brand-kits/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/api/campaigns/:path*',
    '/api/brand-kits/:path*',
    '/api/templates/:path*',
    '/api/analytics/:path*',
  ],
};