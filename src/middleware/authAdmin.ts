import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

/**
 * Admin authentication middleware.
 *
 * Validates the admin session cookie and ensures
 * the authenticated session belongs to an ADMIN.
 */
export async function middleware(
  request: NextRequest
) {
  try {
    const cookieHeader =
      request.headers.get('cookie') || '';

    const match = cookieHeader.match(
      /edupath_admin_sess=([^;]+)/
    );

    const adminSessionId =
      match?.[1] || null;

    /**
     * No admin session.
     */
    if (!adminSessionId) {
      return NextResponse.redirect(
        new URL('/admin/login', request.url)
      );
    }

    /**
     * Validate the admin session.
     */
    const session =
      authManager.getAdminSession(
        adminSessionId
      );

    /**
     * Invalid or expired session.
     */
    if (!session) {
      const response =
        NextResponse.redirect(
          new URL('/admin/login', request.url)
        );

      response.cookies.set(
        'edupath_admin_sess',
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
     * AuthSession uses uppercase role values:
     *
     * ADMIN
     * STUDENT
     *
     * Therefore we must compare against ADMIN.
     */
    if (session.role !== 'ADMIN') {
      const response =
        NextResponse.redirect(
          new URL('/admin/login', request.url)
        );

      response.cookies.set(
        'edupath_admin_sess',
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
     * Valid authenticated admin.
     */
    return NextResponse.next();
  } catch (error: unknown) {
    console.error(
      'Admin middleware error:',
      error
    );

    return NextResponse.redirect(
      new URL('/admin/login', request.url)
    );
  }
}