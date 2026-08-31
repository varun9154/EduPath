import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  findCoursePurchase,
  findCourseProgress,
  createCourseProgress,
  updateCourseProgress,
  CourseProgress,
} from '@/lib/excelStore';

function makeId(
  prefix: string
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

/* =========================================================
   GET COURSE PROGRESS
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const studentId =
      request.nextUrl.searchParams.get(
        'studentId'
      );

    const courseId =
      request.nextUrl.searchParams.get(
        'courseId'
      );

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

    const progress =
      findCourseProgress(
        studentId,
        courseId
      );

    return NextResponse.json({
      success: true,
      progress:
        progress || null,
    });
  } catch (error) {
    console.error(
      'GET COURSE PROGRESS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load course progress.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST / CREATE PROGRESS
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const {
      studentId,
      courseId,
      courseTitle,
      totalModules,
      currentModule,
      currentLesson,
    } = body;

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

    /*
     * Student must own the course.
     */
    const purchase =
      findCoursePurchase(
        studentId,
        courseId
      );

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Student has not purchased this course.',
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Return existing progress.
     */
    const existing =
      findCourseProgress(
        studentId,
        courseId
      );

    if (existing) {
      return NextResponse.json({
        success: true,
        message:
          'Course progress already exists.',
        progress: existing,
      });
    }

    const now =
      new Date().toISOString();

    const progress:
      CourseProgress = {
      progressId:
        makeId('PROGRESS'),

      studentId,

      courseId,

      courseTitle:
        courseTitle ||
        purchase.courseTitle ||
        '',

      progressPercent: 0,

      completedModules: 0,

      totalModules:
        Number(totalModules) ||
        0,

      currentModule:
        currentModule || '',

      currentLesson:
        currentLesson || '',

      status:
        'IN_PROGRESS',

      startedAt: now,

      completedAt: undefined,

      lastAccessedAt: now,

      createdAt: now,

      updatedAt: now,
    };

    const created =
      createCourseProgress(
        progress
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Course progress created.',
        progress: created,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'CREATE COURSE PROGRESS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create course progress.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH / UPDATE PROGRESS
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const {
      studentId,
      courseId,
      progressPercent,
      completedModules,
      totalModules,
      currentModule,
      currentLesson,
      status,
    } = body;

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

    const existing =
      findCourseProgress(
        studentId,
        courseId
      );

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Course progress not found.',
        },
        {
          status: 404,
        }
      );
    }

    const percent =
      progressPercent !==
      undefined
        ? Math.max(
            0,
            Math.min(
              100,
              Number(
                progressPercent
              )
            )
          )
        : existing.progressPercent ||
          0;

    const now =
      new Date().toISOString();

    const updates:
      Partial<CourseProgress> = {
      progressPercent:
        percent,

      completedModules:
        completedModules !==
        undefined
          ? Number(
              completedModules
            )
          : existing.completedModules,

      totalModules:
        totalModules !==
        undefined
          ? Number(
              totalModules
            )
          : existing.totalModules,

      currentModule:
        currentModule !==
        undefined
          ? String(
              currentModule
            )
          : existing.currentModule,

      currentLesson:
        currentLesson !==
        undefined
          ? String(
              currentLesson
            )
          : existing.currentLesson,

      status:
        status ||
        (percent >= 100
          ? 'COMPLETED'
          : 'IN_PROGRESS'),

      lastAccessedAt: now,

      completedAt:
        percent >= 100
          ? existing.completedAt ||
            now
          : existing.completedAt,
    };

    const updated =
      updateCourseProgress(
        existing.progressId,
        updates
      );

    return NextResponse.json({
      success: true,
      message:
        'Course progress updated.',
      progress: updated,
    });
  } catch (error) {
    console.error(
      'UPDATE COURSE PROGRESS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update course progress.',
      },
      {
        status: 500,
      }
    );
  }
}