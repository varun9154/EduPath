export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';
import { validateStudentRequest } from '@/lib/roleGuard';

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  findCoursePurchase,
  findStudentById,
  createCoursePurchase,
  createCourseProgress,
  CoursePurchase,
  CourseProgress,
} from '@/lib/excelStore';

function makeId(
  prefix: string
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

export async function POST(
  request: NextRequest
) {
  try {
    const auth = validateStudentRequest(request);
    if (!auth.authorized) return auth.response!;
    await prepareExcelStore();
    const body =
      await request.json();

    const {
      studentId,
      courseId,
      courseTitle,
      amount,
      currency,
      paymentStatus,
      paymentReference,
      paymentMethod,
    } = body;

    if (studentId && studentId !== auth.userId) {
      return NextResponse.json({ success: false, message: 'You cannot purchase for another student.' }, { status: 403 });
    }

    if (
      !studentId ||
      !courseId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'studentId and courseId are required.',
        },
        {
          status: 400,
        }
      );
    }

    const student =
      findStudentById(
        studentId
      );

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Student not found.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Prevent duplicate purchase.
     */
    const existing =
      findCoursePurchase(
        studentId,
        courseId
      );

    if (existing) {
      return NextResponse.json({
        success: true,
        message:
          'Course is already purchased.',
        purchase: existing,
      });
    }

    const now =
      new Date().toISOString();

    const purchase:
      CoursePurchase = {
      purchaseId:
        makeId('PURCHASE'),

      studentId,

      courseId,

      courseTitle:
        courseTitle || '',

      amount:
        amount !== undefined
          ? Number(amount)
          : 500,

      currency:
        currency || 'INR',

      paymentStatus:
        paymentStatus ||
        'PAID',

      paymentReference:
        paymentReference ||
        makeId('PAY'),

      paymentMethod:
        paymentMethod ||
        'ONLINE',

      status: 'ACTIVE',

      purchasedAt: now,

      createdAt: now,

      updatedAt: now,
    };

    const createdPurchase =
      createCoursePurchase(
        purchase
      );

    /*
     * Automatically create
     * course progress.
     */

    const progress:
      CourseProgress = {
      progressId:
        makeId('PROGRESS'),

      studentId,

      courseId,

      courseTitle:
        courseTitle || '',

      progressPercent: 0,

      completedModules: 0,

      totalModules: 0,

      currentModule: '',

      currentLesson: '',

      status:
        'NOT_STARTED',

      startedAt: undefined,

      completedAt: undefined,

      lastAccessedAt:
        undefined,

      createdAt: now,

      updatedAt: now,
    };

    const createdProgress =
      createCourseProgress(
        progress
      );

    await persistExcelStore();

    return NextResponse.json(
      {
        success: true,

        message:
          'Course purchased successfully.',

        purchase:
          createdPurchase,

        progress:
          createdProgress,

        price:
          createdPurchase.amount,

        currency:
          createdPurchase.currency,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'COURSE PURCHASE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to purchase course.',
      },
      {
        status: 500,
      }
    );
  }
}
