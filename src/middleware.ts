// src/middleware.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server';

/**
 * EduPath Middleware
 *
 * IMPORTANT:
 * This middleware intentionally does NOT import src/lib/auth.ts.
 *
 * auth.ts uses Node.js crypto, which is not available in the
 * Edge Runtime used by Next.js middleware.
 *
 * Authentication/authorization remains enforced by the
 * corresponding server-side API routes and role guards.
 *
 * This middleware is therefore responsible only for routing
 * requests through the appropriate API pipeline.
 */

export function middleware(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  /*
   * =========================================================
   * ADMIN API
   * =========================================================
   *
   * Admin authentication is enforced inside the individual
   * server-side admin API handlers/guards.
   *
   * Do not validate the session here because importing the
   * Node.js auth implementation into Edge middleware would
   * cause the crypto runtime warning/error.
   */

  if (
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  ) {
    return NextResponse.next();
  }

  /*
   * =========================================================
   * STUDENT API
   * =========================================================
   *
   * Student authentication is enforced server-side inside
   * the student API handlers/guards.
   */

  if (
    pathname.startsWith('/api/student/')
  ) {
    return NextResponse.next();
  }

  /*
   * =========================================================
   * STUDENT AUTH
   * =========================================================
   *
   * Login/register/session endpoints remain public as
   * determined by their own API handlers.
   */

  if (
    pathname.startsWith('/api/auth/student')
  ) {
    return NextResponse.next();
  }

  /*
   * =========================================================
   * ADMIN AUTH
   * =========================================================
   */

  if (
    pathname.startsWith('/api/auth/admin')
  ) {
    return NextResponse.next();
  }

  /*
   * =========================================================
   * DEFAULT
   * =========================================================
   */

  return NextResponse.next();
}

/**
 * Run middleware only for the API routes that need
 * middleware-level request handling.
 */
export const config = {
  matcher: [
    '/api/admin',
    '/api/admin/:path*',
    '/api/student/:path*',
    '/api/auth/student/:path*',
    '/api/auth/admin/:path*',
  ],
};