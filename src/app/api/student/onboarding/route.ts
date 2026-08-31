// src/app/api/student/onboarding/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { validateStudentRequest } from '@/lib/roleGuard';
import { getStudentById, updateStudent as updateProductionStudent } from '@/lib/productionDb';
import { findStudentById, updateStudent } from '@/lib/excelStore';
import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';

export async function POST(request: NextRequest) {
  try {
    const guard = validateStudentRequest(request);
    if (!guard.authorized) return guard.response!;
    const sessionId = request.cookies.get('edupath_student_sess')?.value || '';
    const session = authManager.getStudentSession(sessionId);
    if (!session) return NextResponse.json({ success: false, message: 'Student session required.' }, { status: 401 });
    if (!process.env.DATABASE_URL) await prepareExcelStore();

    const body = (await request.json()) as Record<string, unknown>;
    const studentId = String(body.studentId || session.userId);
    if (studentId !== session.userId) return NextResponse.json({ success: false, message: 'You cannot update another student account.' }, { status: 403 });

    const required = ['educationLevel','tenthStatus','state','stream','careerGoal','interestedCourse','targetJob','preferredExam','learningMode'];
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ success: false, message: `${field} is required.` }, { status: 400 });
    }
    if (!Array.isArray(body.skills) || body.skills.length === 0) {
      return NextResponse.json({ success: false, message: 'Please select at least one skill.' }, { status: 400 });
    }

    const existing = process.env.DATABASE_URL
      ? await getStudentById(studentId)
      : findStudentById(studentId);
    if (!existing) return NextResponse.json({ success: false, message: 'Student account not found.' }, { status: 404 });

    const updates: Record<string, unknown> = {
      educationLevel: String(body.educationLevel),
      tenthStatus: String(body.tenthStatus),
      twelfthStatus: body.twelfthStatus ? String(body.twelfthStatus) : '',
      stream: String(body.stream),
      state: String(body.state),
      careerGoal: String(body.careerGoal),
      interestedCourse: String(body.interestedCourse),
      targetJob: String(body.targetJob),
      preferredExam: String(body.preferredExam),
      targetExam: String(body.preferredExam),
      learningMode: String(body.learningMode),
      skills: body.skills.map(String),
      onboardingCompleted: body.onboardingCompleted === true,
      onboardingCompletedAt: body.onboardingCompletedAt ? String(body.onboardingCompletedAt) : new Date().toISOString(),
      status: existing.status || 'ACTIVE',
    };

    const updatedStudent = process.env.DATABASE_URL
      ? await updateProductionStudent(
          studentId,
          updates as unknown as Parameters<typeof updateProductionStudent>[1]
        )
      : updateStudent(
          studentId,
          updates as unknown as Parameters<typeof updateStudent>[1]
        );
    if (!updatedStudent) return NextResponse.json({ success: false, message: 'Unable to update student profile.' }, { status: 500 });
    if (!process.env.DATABASE_URL) await persistExcelStore();

    const safeStudent = { ...updatedStudent, password: undefined, passwordHash: undefined };
    return NextResponse.json({ success: true, message: 'Onboarding completed successfully.', student: safeStudent }, { status: 200 });
  } catch (error) {
    console.error('Student onboarding error:', error);
    return NextResponse.json({ success: false, message: 'Unable to complete onboarding.' }, { status: 500 });
  }
}
