export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';
import { validateStudentRequest } from '@/lib/roleGuard';

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  findStudentById,
  findStudentByEmail,
  updateStudent,
  StudentRecord,
} from '@/lib/excelStore';

/* ======================================================
   GET PROFILE
====================================================== */

export async function GET(
  request: NextRequest
) {
  try {
    const auth = validateStudentRequest(request);
    if (!auth.authorized) return auth.response!;
    await prepareExcelStore();
    const { searchParams } =
      new URL(request.url);

    const studentId =
      searchParams.get('studentId');

    if (studentId && studentId !== auth.userId) {
      return NextResponse.json({ success: false, message: 'You cannot access another student account.' }, { status: 403 });
    }

    const requestedEmail = searchParams.get('email');
    if (!studentId && requestedEmail && requestedEmail.trim().toLowerCase() !== (auth.email || '').toLowerCase()) {
      return NextResponse.json({ success: false, message: 'You cannot access another student account.' }, { status: 403 });
    }

    const email =
      searchParams.get('email');

    let student:
      | StudentRecord
      | null = null;

    /* -----------------------------------------------
       FIND BY STUDENT ID
    ----------------------------------------------- */

    if (studentId) {
      student =
        findStudentById(studentId);
    }

    /* -----------------------------------------------
       FALLBACK: FIND BY EMAIL
    ----------------------------------------------- */

    if (!student && email) {
      student =
        findStudentByEmail(email);
    }

    /* -----------------------------------------------
       NOT FOUND
    ----------------------------------------------- */

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Student profile not found.',
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------
       RESPONSE
    ----------------------------------------------- */

    return NextResponse.json({
      success: true,

      student: {
        studentId:
          student.studentId,

        name:
          student.name,

        email:
          student.email,

        phone:
          student.phone ||
          student.mobile ||
          '',

        educationLevel:
          student.educationLevel ||
          '',

        currentClass:
          student.currentClass ||
          '',

        stream:
          student.stream ||
          '',

        board:
          student.board ||
          '',

        state:
          student.state ||
          '',

        city:
          student.city ||
          '',

        percentage:
          student.percentage ||
          '',

        passingYear:
          student.passingYear ||
          '',

        marks10th:
          student.marks10th ||
          '',

        marks12th:
          student.marks12th ||
          '',

        preferredStudyState:
          student.preferredStudyState ||
          '',

        careerGoal:
          student.careerGoal ||
          '',

        interestedCourse:
          student.interestedCourse ||
          '',

        targetJob:
          student.targetJob ||
          '',

        targetExam:
          student.targetExam ||
          '',

        entranceExams:
          student.entranceExams ||
          '',

        preferredIndustry:
          student.preferredIndustry ||
          '',

        preferredStudyMode:
          student.preferredStudyMode ||
          '',

        budget:
          student.budget ||
          '',

        preferredCollegeType:
          student.preferredCollegeType ||
          '',

        roadmapId:
          student.roadmapId ||
          '',

        currentStep:
          student.currentStep ||
          1,

        totalSteps:
          student.totalSteps ||
          16,

        onboardingCompleted:
          student.onboardingCompleted ||
          false,

        onboardingCompletedAt:
          student.onboardingCompletedAt ||
          '',

        registeredAt:
          student.registeredAt,

        updatedAt:
          student.updatedAt,

        status:
          student.status ||
          'ACTIVE',
      },
    });
  } catch (error) {
    console.error(
      'Student profile GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load student profile.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ======================================================
   UPDATE PROFILE
====================================================== */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const studentId =
      body.studentId;

    const email =
      body.email;

    let student:
      | StudentRecord
      | null = null;

    /* -----------------------------------------------
       FIND EXISTING STUDENT
    ----------------------------------------------- */

    if (studentId) {
      student =
        findStudentById(
          String(studentId)
        );
    }

    if (!student && email) {
      student =
        findStudentByEmail(
          String(email)
        );
    }

    /* -----------------------------------------------
       NOT FOUND
    ----------------------------------------------- */

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Student account not found.',
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------
       ALLOWED PROFILE FIELDS
    ----------------------------------------------- */

    const updates:
      Partial<StudentRecord> = {};

    if (
      body.name !== undefined
    ) {
      updates.name =
        String(body.name);
    }

    if (
      body.phone !== undefined
    ) {
      updates.phone =
        String(body.phone);
    }

    if (
      body.mobile !== undefined
    ) {
      updates.mobile =
        String(body.mobile);
    }

    if (
      body.educationLevel !== undefined
    ) {
      updates.educationLevel =
        String(
          body.educationLevel
        );
    }

    if (
      body.currentClass !== undefined
    ) {
      updates.currentClass =
        String(
          body.currentClass
        );
    }

    if (
      body.stream !== undefined
    ) {
      updates.stream =
        String(body.stream);
    }

    if (
      body.board !== undefined
    ) {
      updates.board =
        String(body.board);
    }

    if (
      body.state !== undefined
    ) {
      updates.state =
        String(body.state);
    }

    if (
      body.city !== undefined
    ) {
      updates.city =
        String(body.city);
    }

    if (
      body.percentage !== undefined
    ) {
      updates.percentage =
        body.percentage;
    }

    if (
      body.passingYear !== undefined
    ) {
      updates.passingYear =
        body.passingYear;
    }

    if (
      body.marks10th !== undefined
    ) {
      updates.marks10th =
        body.marks10th;
    }

    if (
      body.marks12th !== undefined
    ) {
      updates.marks12th =
        body.marks12th;
    }

    if (
      body.preferredStudyState !== undefined
    ) {
      updates.preferredStudyState =
        String(
          body.preferredStudyState
        );
    }

    if (
      body.careerGoal !== undefined
    ) {
      updates.careerGoal =
        String(
          body.careerGoal
        );
    }

    if (
      body.interestedCourse !== undefined
    ) {
      updates.interestedCourse =
        String(
          body.interestedCourse
        );
    }

    if (
      body.targetJob !== undefined
    ) {
      updates.targetJob =
        String(
          body.targetJob
        );
    }

    if (
      body.targetExam !== undefined
    ) {
      updates.targetExam =
        String(
          body.targetExam
        );
    }

    if (
      body.entranceExams !== undefined
    ) {
      updates.entranceExams =
        body.entranceExams;
    }

    if (
      body.preferredIndustry !== undefined
    ) {
      updates.preferredIndustry =
        String(
          body.preferredIndustry
        );
    }

    if (
      body.preferredStudyMode !== undefined
    ) {
      updates.preferredStudyMode =
        String(
          body.preferredStudyMode
        );
    }

    if (
      body.budget !== undefined
    ) {
      updates.budget =
        body.budget;
    }

    if (
      body.preferredCollegeType !== undefined
    ) {
      updates.preferredCollegeType =
        String(
          body.preferredCollegeType
        );
    }

    if (
      body.roadmapId !== undefined
    ) {
      updates.roadmapId =
        String(
          body.roadmapId
        );
    }

    if (
      body.currentStep !== undefined
    ) {
      updates.currentStep =
        body.currentStep;
    }

    if (
      body.totalSteps !== undefined
    ) {
      updates.totalSteps =
        body.totalSteps;
    }

    if (
      body.onboardingCompleted !== undefined
    ) {
      updates.onboardingCompleted =
        body.onboardingCompleted;
    }

    if (
      body.onboardingCompletedAt !== undefined
    ) {
      updates.onboardingCompletedAt =
        String(
          body.onboardingCompletedAt
        );
    }

    /* -----------------------------------------------
       UPDATE EXCEL
    ----------------------------------------------- */

    const updatedStudent =
      updateStudent(
        student.studentId,
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
        {
          status: 500,
        }
      );
    }

    /* -----------------------------------------------
       RESPONSE
    ----------------------------------------------- */

    return NextResponse.json({
      success: true,

      message:
        'Student profile updated successfully.',

      student:
        updatedStudent,
    });
  } catch (error) {
    console.error(
      'Student profile PATCH error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to update student profile.',
      },
      {
        status: 500,
      }
    );
  }
}
