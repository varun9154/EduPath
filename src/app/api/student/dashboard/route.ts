import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { findStudentById, getStudentDemoBookings } from '@/lib/excelStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('edupath_student_sess')?.value || '';
    const session = authManager.getStudentSession(sessionId);
    if (!session) return NextResponse.json({ success:false, message:'Missing or expired student session.' }, { status:401 });

    const studentId = new URL(request.url).searchParams.get('studentId');
    if (studentId && studentId !== session.userId) return NextResponse.json({ success:false, message:'You cannot access another student profile.' }, { status:403 });

    const student = findStudentById(session.userId);
    if (!student) return NextResponse.json({ success:false, message:'Student account not found.' }, { status:404 });

    return NextResponse.json({ success:true, student, demoBookings:getStudentDemoBookings(student.studentId) });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ success:false, message:'Unable to load student dashboard.' }, { status:500 });
  }
}
