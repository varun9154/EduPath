import { NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

/**
 * POST /api/auth/student/force-logout
 *
 * Body:
 * {
 *   email: string
 * }
 *
 * Logs out the existing student session for the
 * supplied email and clears the authentication cookie.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body?.email === 'string'
        ? body.email.trim()
        : '';

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required.',
        },
        { status: 400 }
      );
    }

    /**
     * logoutStudent accepts only the email
     * and returns a boolean.
     */
    const loggedOut = authManager.logoutStudent(email);

    /**
     * Create response.
     */
    const response = NextResponse.json({
      success: loggedOut,
      message: loggedOut
        ? 'Student logged out successfully.'
        : 'No active student session was found.',
    });

    /**
     * Always clear the existing student
     * authentication cookie.
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
  } catch (error: unknown) {
    console.error(
      'Student force logout error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Force logout error';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}