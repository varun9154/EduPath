export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore } from '@/lib/excelPersistence';
import { validateStudentRequest } from '@/lib/roleGuard';

import { NextRequest, NextResponse } from 'next/server';

import {
  findStudentById,
  findStudentByEmail,
  getStudentDemoBookings,
  StudentRecord,
} from '@/lib/excelStore';

/* ======================================================
   GET STUDENT DASHBOARD
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
       FIND STUDENT
    ----------------------------------------------- */

    if (studentId) {
      student =
        findStudentById(studentId);
    }

    if (!student && email) {
      student =
        findStudentByEmail(email);
    }

    /* -----------------------------------------------
       STUDENT NOT FOUND
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
       DEMO BOOKINGS
    ----------------------------------------------- */

    const demoBookings =
      getStudentDemoBookings(
        student.studentId
      );

    /* -----------------------------------------------
       DASHBOARD RESPONSE
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

        state:
          student.state ||
          '',

        city:
          student.city ||
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

        registeredAt:
          student.registeredAt,

        updatedAt:
          student.updatedAt,

        status:
          student.status ||
          'ACTIVE',
      },

      demoBookings,
    });
  } catch (error) {
    console.error(
      'Student dashboard error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load student dashboard.',
      },
      {
        status: 500,
      }
    );
  }
}
