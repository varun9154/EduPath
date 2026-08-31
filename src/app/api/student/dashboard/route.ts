// src/app/api/student/dashboard/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { validateStudentRequest } from '@/lib/roleGuard';
import {
  getStudentByEmail,
  getStudentById,
  getStudentDemoBookings,
} from '@/lib/productionDb';
import { findStudentByEmail, findStudentById, getStudentDemoBookings as getExcelDemos } from '@/lib/excelStore';
import { prepareExcelStore } from '@/lib/excelPersistence';

export async function GET(request: NextRequest) {
  try {
    const guard = validateStudentRequest(request);
    if (!guard.authorized) return guard.response!;
    if (!process.env.DATABASE_URL) await prepareExcelStore();

    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get('studentId');
    const requestedEmail = searchParams.get('email');

    const sessionId = request.cookies.get('edupath_student_sess')?.value || '';
    const session = authManager.getStudentSession(sessionId);
    if (!session) return NextResponse.json({ success: false, message: 'Student session required.' }, { status: 401 });

    if (requestedStudentId && requestedStudentId !== session.userId) {
      return NextResponse.json({ success: false, message: 'You cannot access another student account.' }, { status: 403 });
    }
    if (requestedEmail && requestedEmail.trim().toLowerCase() !== session.email.toLowerCase()) {
      return NextResponse.json({ success: false, message: 'You cannot access another student account.' }, { status: 403 });
    }

    const student = process.env.DATABASE_URL
      ? await getStudentById(session.userId) || await getStudentByEmail(session.email)
      : findStudentById(session.userId) || findStudentByEmail(session.email);

    if (!student) return NextResponse.json({ success: false, message: 'Student account not found.' }, { status: 404 });

    const demoBookings = process.env.DATABASE_URL
      ? await getStudentDemoBookings(student.studentId)
      : getExcelDemos(student.studentId);

    return NextResponse.json({
      success: true,
      student,
      demoBookings,
      data: { student, demoBookings },
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ success: false, message: 'Unable to load student dashboard.' }, { status: 500 });
  }
}
