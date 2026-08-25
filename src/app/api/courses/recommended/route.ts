export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore } from '@/lib/excelPersistence';
import { validateStudentRequest } from '@/lib/roleGuard';

import { NextRequest, NextResponse } from 'next/server';

import {
  findStudentById
} from '@/lib/excelStore';

import {
  getRecommendedCourses
} from '@/lib/courseMatcher';

export async function GET(
  request: NextRequest
) {
  try {
    const auth = validateStudentRequest(request);
    if (!auth.authorized) return auth.response!;
    await prepareExcelStore();
    const studentId =
      request.nextUrl.searchParams.get(
        'studentId'
      );

    if (studentId && studentId !== auth.userId) {
      return NextResponse.json({ success: false, message: 'You cannot access another student account.' }, { status: 403 });
    }

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'studentId is required.'
        },
        {
          status: 400
        }
      );
    }

    const student =
      findStudentById(studentId);

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Student not found.'
        },
        {
          status: 404
        }
      );
    }

    const courses =
      getRecommendedCourses({
        educationLevel:
          student.educationLevel,

        stream:
          student.stream,

        state:
          student.state,

        careerGoal:
          String(student.careerGoal ?? ''),

        interestedCourse:
          String(student.interestedCourse ?? ''),

        targetJob:
          student.targetJob
      });

    return NextResponse.json({
      success: true,

      student: {
        studentId:
          student.studentId,

        name:
          student.name
      },

      courses
    });
  } catch (error) {
    console.error(
      'Recommended courses error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Unable to load recommended courses.'
      },
      {
        status: 500
      }
    );
  }
}
