// src/lib/roleGuard.ts

import { NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

/*
============================================================
ADMIN REQUEST VALIDATION
============================================================
*/

export function validateAdminRequest(
  req: Request
): {
  authorized: boolean;
  response?: NextResponse;
  sessionId?: string;
} {

  const cookieHeader =
    req.headers.get('cookie') || '';

  const match =
    cookieHeader.match(
      /(?:^|;\s*)edupath_admin_sess=([^;]+)/
    );

  const sessionId =
    match?.[1]
      ? decodeURIComponent(match[1])
      : null;

  if (!sessionId) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Missing admin session',
        },
        { status: 401 }
      ),
    };
  }

  if (
    !authManager.validateAdminSession(
      sessionId
    )
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Admin session expired or invalid',
        },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    sessionId,
  };
}

/*
============================================================
STUDENT REQUEST VALIDATION
============================================================
*/

export function validateStudentRequest(
  req: Request
): {
  authorized: boolean;
  response?: NextResponse;
  sessionId?: string;
} {

  const cookieHeader =
    req.headers.get('cookie') || '';

  const match =
    cookieHeader.match(
      /(?:^|;\s*)edupath_student_sess=([^;]+)/
    );

  const sessionId =
    match?.[1]
      ? decodeURIComponent(match[1])
      : null;

  if (!sessionId) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Missing student session',
        },
        { status: 401 }
      ),
    };
  }

  if (
    !authManager.validateStudentSession(
      sessionId
    )
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Student session expired or invalid',
        },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    sessionId,
  };
}