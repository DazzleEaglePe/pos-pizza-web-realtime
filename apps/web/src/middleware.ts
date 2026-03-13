import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pos_access_token')?.value;
  const path = request.nextUrl.pathname;

  // Paths that require authentication
  const isProtectedRoute = path.startsWith('/pos') || path.startsWith('/kitchen') || path.startsWith('/admin');
  
  // Auth paths
  const isAuthRoute = path === '/login';

  // If trying to access a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login page while authenticated, redirect to POS
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pos/:path*', '/kitchen/:path*', '/admin/:path*', '/login'],
};
