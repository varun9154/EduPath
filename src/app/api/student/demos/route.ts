// src/app/api/student/demos/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { validateStudentRequest } from '@/lib/roleGuard';
import { getStudentById, getStudentDemoBookings } from '@/lib/productionDb';
import { findStudentById, getStudentDemoBookings as getExcelDemos } from '@/lib/excelStore';
import { prepareExcelStore } from '@/lib/excelPersistence';

export async function GET(request: NextRequest) {
  try {
    const guard = validateStudentRequest(request);
    if (!guard.authorized) return guard.response!;
    const sessionId = request.cookies.get('edupath_student_sess')?.value || '';
    const session = authManager.getStudentSession(sessionId);
    if (!session) return NextResponse.json({ success: false, message: 'Student session required.' }, { status: 401 });

    if (!process.env.DATABASE_URL) await prepareExcelStore();
    const student = process.env.DATABASE_URL
      ? await getStudentById(session.userId)
      : findStudentById(session.userId);
    if (!student) return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });

    const demoBookings = process.env.DATABASE_URL
      ? await getStudentDemoBookings(student.studentId)
      : getExcelDemos(student.studentId);

    return NextResponse.json({ success: true, demoBookings, data: demoBookings });
  } catch (error) {
    console.error('Student demos error:', error);
    return NextResponse.json({ success: false, message: 'Unable to load demo bookings.' }, { status: 500 });
  }
}
