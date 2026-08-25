export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieHeader =
      req.headers.get('cookie') || '';

    const match = cookieHeader.match(
      /edupath_admin_sess=([^;]+)/
    );

    const sessionId = match?.[1];

    if (sessionId) {
      authManager.destroyAdminSession(sessionId);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin logged out successfully',
    });

    response.cookies.set(
      'edupath_admin_sess',
      '',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to logout',
      },
      { status: 500 }
    );
  }
}