import { NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

type GuardResult = {
  authorized: boolean;
  response?: NextResponse;
  sessionId?: string;
  userId?: string;
  email?: string;
};

function cookieValue(req: Request, name: string) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function validateAdminRequest(req: Request): GuardResult {
  const sessionId = cookieValue(req, 'edupath_admin_sess');
  if (!sessionId || !authManager.validateAdminSession(sessionId)) {
    return { authorized: false, response: NextResponse.json({ success: false, message: 'Admin session expired or invalid.' }, { status: 401 }) };
  }
  const session = authManager.getAdminSession(sessionId);
  return { authorized: true, sessionId, userId: session?.userId, email: session?.email };
}

export function validateStudentRequest(req: Request): GuardResult {
  const sessionId = cookieValue(req, 'edupath_student_sess');
  if (!sessionId || !authManager.validateStudentSession(sessionId)) {
    return { authorized: false, response: NextResponse.json({ success: false, message: 'Student session expired or invalid.' }, { status: 401 }) };
  }
  const session = authManager.getStudentSession(sessionId);
  return { authorized: true, sessionId, userId: session?.userId, email: session?.email };
}
