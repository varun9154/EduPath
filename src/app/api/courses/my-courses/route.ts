export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore } from '@/lib/excelPersistence';
import { validateStudentRequest } from '@/lib/roleGuard';

import { NextRequest, NextResponse } from 'next/server';

import {
  getStudentCoursePurchases,
  getStudentCourseProgress
} from '@/lib/excelStore';

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

    const purchases =
      getStudentCoursePurchases(
        studentId
      );

    const progress =
      getStudentCourseProgress(
        studentId
      );

    const courses =
      purchases
        .filter(
          (purchase) =>
            purchase.paymentStatus ===
            'PAID'
        )
        .map((purchase) => {
          const courseProgress =
            progress.find(
              (item) =>
                item.courseId ===
                purchase.courseId
            );

          return {
            ...purchase,

            progress:
              courseProgress || null
          };
        });

    return NextResponse.json({
      success: true,

      courses,

      total:
        courses.length
    });
  } catch (error) {
    console.error(
      'My courses error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Unable to load courses.'
      },
      {
        status: 500
      }
    );
  }
}
