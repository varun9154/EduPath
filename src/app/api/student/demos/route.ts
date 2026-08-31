import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { getStudentDemoBookings, findStudentById } from '@/lib/excelStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('edupath_student_sess')?.value || '';
    const session = authManager.getStudentSession(sessionId);
    if (!session) return NextResponse.json({ success:false, message:'Student session required.' }, { status:401 });

    const student = findStudentById(session.userId);
    if (!student) return NextResponse.json({ success:false, message:'Student not found.' }, { status:404 });

    return NextResponse.json({ success:true, demoBookings:getStudentDemoBookings(student.studentId) });
  } catch (error) {
    console.error('Student demos error:', error);
    return NextResponse.json({ success:false, message:'Unable to load demo bookings.' }, { status:500 });
  }
}
