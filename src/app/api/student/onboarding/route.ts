export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';
import { validateStudentRequest } from '@/lib/roleGuard';

import { NextRequest, NextResponse } from 'next/server';

import {
  findStudentById,
  updateStudent,
  type StudentRecord,
} from '@/lib/excelStore';

export async function POST(request: NextRequest) {
  try {
    const auth = validateStudentRequest(request);
    if (!auth.authorized) return auth.response!;
    await prepareExcelStore();
    const body = await request.json();

    const {
      studentId,
      educationLevel,
      tenthStatus,
      twelfthStatus,
      stream,
      state,
      careerGoal,
      interestedCourse,
      targetJob,
      preferredExam,
      learningMode,
      skills,
      onboardingCompleted,
      onboardingCompletedAt,
    } = body;

    /* --------------------------------------------------
       VALIDATION
    -------------------------------------------------- */

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student ID is required.',
        },
        { status: 400 }
      );
    }

    if (String(studentId) !== auth.userId) {
      return NextResponse.json({ success: false, message: 'You cannot update another student account.' }, { status: 403 });
    }

    const student = findStudentById(
      String(studentId)
    );

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student account not found.',
        },
        { status: 404 }
      );
    }

    if (!educationLevel) {
      return NextResponse.json(
        {
          success: false,
          message: 'Education level is required.',
        },
        { status: 400 }
      );
    }

    if (!tenthStatus) {
      return NextResponse.json(
        {
          success: false,
          message: '10th status is required.',
        },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        {
          success: false,
          message: 'State is required.',
        },
        { status: 400 }
      );
    }

    if (!stream) {
      return NextResponse.json(
        {
          success: false,
          message: 'Stream is required.',
        },
        { status: 400 }
      );
    }

    if (!careerGoal) {
      return NextResponse.json(
        {
          success: false,
          message: 'Career goal is required.',
        },
        { status: 400 }
      );
    }

    if (!interestedCourse) {
      return NextResponse.json(
        {
          success: false,
          message: 'Interested course is required.',
        },
        { status: 400 }
      );
    }

    if (!targetJob) {
      return NextResponse.json(
        {
          success: false,
          message: 'Target job is required.',
        },
        { status: 400 }
      );
    }

    if (!preferredExam) {
      return NextResponse.json(
        {
          success: false,
          message: 'Preferred exam is required.',
        },
        { status: 400 }
      );
    }

    if (!learningMode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Learning mode is required.',
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(skills) ||
      skills.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please select at least one skill.',
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------
       UPDATE STUDENT
    -------------------------------------------------- */

    const updates: Partial<StudentRecord> = {
      educationLevel: String(
        educationLevel
      ),

      tenthStatus: String(
        tenthStatus
      ),

      twelfthStatus: twelfthStatus
        ? String(twelfthStatus)
        : '',

      stream: String(stream),

      state: String(state),

      careerGoal: String(
        careerGoal
      ),

      interestedCourse: String(
        interestedCourse
      ),

      targetJob: String(
        targetJob
      ),

      preferredExam: String(
        preferredExam
      ),

      learningMode: String(
        learningMode
      ),

      skills: skills.map(
        (skill: unknown) =>
          String(skill)
      ),

      onboardingCompleted:
        onboardingCompleted === true,

      onboardingCompletedAt:
        onboardingCompletedAt
          ? String(
              onboardingCompletedAt
            )
          : new Date().toISOString(),

      status:
        student.status ||
        'ACTIVE',
    };

    const updatedStudent =
      updateStudent(
        String(studentId),
        updates
      );

    if (!updatedStudent) {
      await persistExcelStore();

    return NextResponse.json(
        {
          success: false,
          message:
            'Unable to update student profile.',
        },
        { status: 500 }
      );
    }

    /* --------------------------------------------------
       RESPONSE
    -------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        message:
          'Onboarding completed successfully.',

        student: {
          ...updatedStudent,

          // Never return password to browser
          password: undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'Student onboarding error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to save onboarding details.',
      },
      { status: 500 }
    );
  }
}
