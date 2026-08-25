export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const action = String(
      body?.action || 'login'
    )
      .trim()
      .toLowerCase();

    const email = String(
      body?.email || ''
    )
      .trim()
      .toLowerCase();

    const password = String(
      body?.password || ''
    );

    const deviceInfo = String(
      body?.deviceInfo || 'Web Browser'
    );

    /*
     * ============================
     * LOGOUT
     * ============================
     */

    if (action === 'logout') {
      const cookieHeader =
        req.headers.get('cookie') || '';

      const match = cookieHeader.match(
        /(?:^|;\s*)edupath_admin_sess=([^;]+)/
      );

      const sessionId =
        match?.[1] || '';

      if (sessionId) {
        authManager.logoutAdmin(
          sessionId
        );
      }

      const response =
        NextResponse.json({
          success: true,
          message:
            'Admin logged out successfully',
        });

      response.cookies.set(
        'edupath_admin_sess',
        '',
        {
          httpOnly: true,
          expires: new Date(0),
          path: '/',
        }
      );

      return response;
    }

    /*
     * ============================
     * LOGIN
     * ============================
     */

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Admin email and password are required',
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      'Admin login attempt:',
      email
    );

    /*
     * AuthManager
     */
    const result =
      authManager.loginAdmin(
        email,
        password,
        deviceInfo
      );

    /*
     * Authentication failed
     */
    if (
      !result ||
      !result.success
    ) {
      console.log(
        'Admin authentication failed:',
        result?.message
      );

      return NextResponse.json(
        {
          success: false,
          message:
            result?.message ||
            'Invalid admin email or password',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Session validation
     */
    if (!result.sessionId) {
      console.error(
        'Admin authentication succeeded but sessionId is missing'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Admin session could not be created',
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Create response
     */
    const response =
      NextResponse.json({
        success: true,
        message:
          'Admin login successful',
        role: 'ADMIN',
        sessionId:
          result.sessionId,
      });

    /*
     * IMPORTANT:
     * Create HttpOnly authentication cookie.
     */
    response.cookies.set(
      'edupath_admin_sess',
      result.sessionId,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          'production',

        sameSite: 'lax',

        path: '/',

        maxAge:
          60 * 60 * 24 * 7,
      }
    );

    console.log(
      'Admin login successful. Session created.'
    );

    return response;

  } catch (error) {
    console.error(
      'Admin authentication error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}