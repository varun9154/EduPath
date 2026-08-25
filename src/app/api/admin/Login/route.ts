export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin email and password are required',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // ADMIN LOGIN
    // ---------------------------------------------------------
    // Your current authManager.loginAdmin() accepts only:
    // loginAdmin(email, password)

    const result = authManager.loginAdmin(
      email,
      password
    );

    // ---------------------------------------------------------
    // LOGIN FAILED
    // ---------------------------------------------------------

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.message || 'Invalid admin email or password',
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // MAKE SURE SESSION EXISTS
    // ---------------------------------------------------------

    if (!result.sessionId) {
      console.error(
        'Admin login succeeded but sessionId was not returned'
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Admin session could not be created',
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // CREATE RESPONSE
    // ---------------------------------------------------------

    const response = NextResponse.json({
      success: true,
      message: result.message || 'Admin login successful',
      role: 'ADMIN',
      session: result.sessionId,
    });

    // ---------------------------------------------------------
    // SET ADMIN SESSION COOKIE
    // ---------------------------------------------------------

    response.cookies.set({
      name: 'edupath_admin_sess',
      value: result.sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    );
  }
}