export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authManager, COOKIE_MAX_AGE } from '@/lib/auth';
import { leadStore } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    await prepareExcelStore();
    const body = await req.json();
    const action = String(body?.action || 'login').toLowerCase();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const deviceInfo = String(body?.deviceInfo || 'Web Browser');

    if (!email || !password) return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });

    if (action === 'register') {
      const student = leadStore.getStudentByEmail(email);
      if (!student) return NextResponse.json({ success: false, message: 'Complete student registration before creating login credentials.' }, { status: 404 });
      if (password.length < 6) return NextResponse.json({ success: false, message: 'Password must contain at least 6 characters.' }, { status: 400 });
      const updated = leadStore.updateStudentPassword(student.studentId, bcrypt.hashSync(password, 12));
      await persistExcelStore();
      if (!updated) return NextResponse.json({ success: false, message: 'Unable to create student credentials.' }, { status: 500 });
      const result = authManager.loginStudent(email, password, deviceInfo);
      if (!result.success || !result.sessionId) return NextResponse.json({ success: false, message: result.message }, { status: 401 });
      const response = NextResponse.json({ success: true, message: 'Student account created successfully.', role: 'STUDENT', sessionId: result.sessionId, student: result.user });
      response.cookies.set('edupath_student_sess', result.sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE });
      response.cookies.set('edupath_student_id', student.studentId, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE });
      return response;
    }

    const result = authManager.loginStudent(email, password, deviceInfo);
    if (!result.success || !result.sessionId) return NextResponse.json({ success: false, message: result.message || 'Invalid student email or password.' }, { status: 401 });

    const response = NextResponse.json({ success: true, message: result.message, role: 'STUDENT', sessionId: result.sessionId, student: result.user });
    response.cookies.set('edupath_student_sess', result.sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE });
    response.cookies.set('edupath_student_id', result.user?.id || '', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE });
    return response;
  } catch (error) {
    console.error('Student auth error:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Student authentication failed.' }, { status: 500 });
  }
}
