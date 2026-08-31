// src/app/api/student/profile/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { validateStudentRequest } from '@/lib/roleGuard';
import { getStudentByEmail, getStudentById, updateStudent as updateProductionStudent } from '@/lib/productionDb';
import { findStudentByEmail, findStudentById, updateStudent } from '@/lib/excelStore';
import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';

function getSession(request: Request) {
  const id = request.headers.get('cookie')?.match(/(?:^|;\s*)edupath_student_sess=([^;]+)/)?.[1];
  return id ? authManager.getStudentSession(decodeURIComponent(id)) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : fallback;
}

function publicStudent(student: unknown) {
  const data = isRecord(student) ? student : {};
  const phone = asText(data.phone || data.mobile);
  const preferredStudyMode = asText(
    data.preferredStudyMode || data.learningMode
  );

  return {
    studentId: asText(data.studentId),
    name: asText(data.name),
    email: asText(data.email),
    phone,
    mobile: asText(data.mobile || data.phone),
    educationLevel: asText(data.educationLevel),
    currentClass: asText(data.currentClass),
    stream: asText(data.stream),
    board: asText(data.board),
    state: asText(data.state),
    city: asText(data.city),
    percentage: asText(data.percentage),
    passingYear: asText(data.passingYear),
    marks10th: asText(data.marks10th),
    marks12th: asText(data.marks12th),
    preferredStudyState: asText(data.preferredStudyState),
    careerGoal: asText(data.careerGoal),
    interestedCourse: asText(data.interestedCourse),
    targetJob: asText(data.targetJob),
    targetExam: asText(data.targetExam || data.preferredExam),
    entranceExams:
      Array.isArray(data.entranceExams)
        ? data.entranceExams
        : asText(data.entranceExams),
    preferredIndustry: asText(data.preferredIndustry),
    preferredStudyMode,
    learningMode: asText(data.learningMode),
    budget: data.budget ?? '',
    preferredCollegeType: asText(data.preferredCollegeType),
    roadmapId: asText(data.roadmapId),
    currentStep:
      typeof data.currentStep === 'number'
        ? data.currentStep
        : Number(data.currentStep || 1),
    totalSteps:
      typeof data.totalSteps === 'number'
        ? data.totalSteps
        : Number(data.totalSteps || 16),
    onboardingCompleted: Boolean(data.onboardingCompleted),
    onboardingCompletedAt: asText(data.onboardingCompletedAt),
    registeredAt: asText(data.registeredAt || data.registrationDate),
    updatedAt: asText(data.updatedAt || data.registrationDate),
    status: asText(data.status, 'ACTIVE'),
  };
}

export async function GET(request: NextRequest) {
  try {
    const guard = validateStudentRequest(request);
    if (!guard.authorized) return guard.response!;
    const session = getSession(request);
    if (!session) return NextResponse.json({ success: false, message: 'Student session required.' }, { status: 401 });
    if (!process.env.DATABASE_URL) await prepareExcelStore();

    const student = process.env.DATABASE_URL
      ? await getStudentById(session.userId) || await getStudentByEmail(session.email)
      : findStudentById(session.userId) || findStudentByEmail(session.email);

    if (!student) return NextResponse.json({ success: false, message: 'Student profile not found.' }, { status: 404 });
    return NextResponse.json({ success: true, student: publicStudent(student) });
  } catch (error) {
    console.error('Student profile GET error:', error);
    return NextResponse.json({ success: false, message: 'Unable to load student profile.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = validateStudentRequest(request);
    if (!guard.authorized) return guard.response!;
    const session = getSession(request);
    if (!session) return NextResponse.json({ success: false, message: 'Student session required.' }, { status: 401 });
    if (!process.env.DATABASE_URL) await prepareExcelStore();

    const body = (await request.json()) as Record<string, unknown>;
    const student = process.env.DATABASE_URL
      ? await getStudentById(session.userId)
      : findStudentById(session.userId);
    if (!student) return NextResponse.json({ success: false, message: 'Student account not found.' }, { status: 404 });

    const allowedKeys = [
      'name','phone','mobile','educationLevel','currentClass','stream','board','state','city',
      'percentage','passingYear','marks10th','marks12th','preferredStudyState','careerGoal',
      'interestedCourse','targetJob','targetExam','entranceExams','preferredExam','preferredIndustry',
      'preferredStudyMode','learningMode','budget','preferredCollegeType','roadmapId','currentStep',
      'totalSteps','onboardingCompleted','onboardingCompletedAt','skills','status'
    ] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const value = body[key];

        if (key === 'entranceExams' || key === 'skills') {
          updates[key] = Array.isArray(value)
            ? value.map(String)
            : String(value);
        } else if (
          key === 'percentage' ||
          key === 'passingYear' ||
          key === 'marks10th' ||
          key === 'marks12th'
        ) {
          updates[key] = String(value);
        } else if (
          key === 'currentStep' ||
          key === 'totalSteps'
        ) {
          const numericValue = Number(value);
          if (Number.isFinite(numericValue)) {
            updates[key] = numericValue;
          }
        } else if (
          key === 'onboardingCompleted'
        ) {
          updates[key] = value === true;
        } else {
          updates[key] = value;
        }
      }
    }

    const updatedStudent = process.env.DATABASE_URL
      ? await updateProductionStudent(
          student.studentId,
          updates as unknown as Parameters<typeof updateProductionStudent>[1]
        )
      : updateStudent(
          student.studentId,
          updates as unknown as Parameters<typeof updateStudent>[1]
        );
    if (!updatedStudent) return NextResponse.json({ success: false, message: 'Unable to update student profile.' }, { status: 500 });

    if (!process.env.DATABASE_URL) await persistExcelStore();
    return NextResponse.json({ success: true, message: 'Student profile updated successfully.', student: publicStudent(updatedStudent) });
  } catch (error) {
    console.error('Student profile PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Unable to update student profile.' }, { status: 500 });
  }
}
