// src/middleware/authStudent.ts

import { NextRequest, NextResponse } from 'next/server';
import { authManager, AuthSession } from '@/lib/auth';

/**
 * ============================================================
 * EDUPath - Student Authentication Middleware
 * ============================================================
 *
 * Protects student-only routes.
 *
 * Authentication is handled through AuthManager.
 * The student session ID is stored in:
 *
 *   edupath_student_sess
 *
 * The middleware:
 *
 * 1. Reads the student authentication cookie.
 * 2. Validates the session using AuthManager.
 * 3. Ensures the session belongs to a STUDENT.
 * 4. Redirects unauthenticated users to /login.
 * 5. Allows authenticated students to continue.
 *
 * ============================================================
 */

export async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  /**
   * ----------------------------------------------------------
   * Read authentication cookie
   * ----------------------------------------------------------
   */

  const cookieHeader = request.headers.get('cookie') || '';

  const match = cookieHeader.match(
    /(?:^|;\s*)edupath_student_sess=([^;]+)/
  );

  const studentSessionId = match?.[1] || null;

  /**
   * ----------------------------------------------------------
   * No student session
   * ----------------------------------------------------------
   */

  if (!studentSessionId) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  /**
   * ----------------------------------------------------------
   * Validate student session
   * ----------------------------------------------------------
   */

  let session: AuthSession | null = null;

  try {
    session = authManager.getStudentSession(
      studentSessionId
    );
  } catch (error) {
    console.error(
      'Student session validation failed:',
      error
    );

    session = null;
  }

  /**
   * ----------------------------------------------------------
   * Invalid / expired session
   * ----------------------------------------------------------
   */

  if (!session) {
    const response = NextResponse.redirect(
      new URL('/login', request.url)
    );

    /**
     * Remove invalid authentication cookie.
     */
    response.cookies.set(
      'edupath_student_sess',
      '',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      }
    );

    return response;
  }

  /**
   * ----------------------------------------------------------
   * Verify student role
   * ----------------------------------------------------------
   *
   * AuthSession uses uppercase role values:
   *
   *   ADMIN
   *   STUDENT
   *
   * Do NOT compare against "student".
   */

  if (session.role !== 'STUDENT') {
    const response = NextResponse.redirect(
      new URL('/login', request.url)
    );

    /**
     * Remove the invalid student cookie.
     */
    response.cookies.set(
      'edupath_student_sess',
      '',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      }
    );

    return response;
  }

  /**
   * ----------------------------------------------------------
   * Authentication successful
   * ----------------------------------------------------------
   *
   * Attach useful authentication information to headers so
   * downstream server-side code can access it if required.
   */

  const response = NextResponse.next();

  response.headers.set(
    'x-edupath-authenticated',
    'true'
  );

  response.headers.set(
    'x-edupath-role',
    'STUDENT'
  );

  if (session.email) {
    response.headers.set(
      'x-edupath-student-email',
      session.email
    );
  }

  return response;
}

/**
 * ============================================================
 * Optional matcher
 * ============================================================
 *
 * If this file is being imported by the main middleware,
 * the matcher below is not required.
 *
 * Keep it here only if this file is being used directly
 * as Next.js middleware.
 * ============================================================
 */

// export const config = {
//   matcher: [
//     '/dashboard/:path*',
//     '/student/:path*',
//     '/courses/my-courses/:path*',
//     '/api/student/:path*',
//   ],
// };