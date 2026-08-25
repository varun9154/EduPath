export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore } from '@/lib/excelPersistence';
import { getStudentById as getProductionStudentById, getStudentDemoBookings as getProductionStudentDemoBookings } from '@/lib/productionDb';
import { validateStudentRequest } from '@/lib/roleGuard';

import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentDemoBookings,
  findStudentById,
} from '@/lib/excelStore';

export async function GET(
  request: NextRequest
) {
  try {
    const auth = validateStudentRequest(request);
    if (!auth.authorized) return auth.response!;
    if (!process.env.DATABASE_URL) await prepareExcelStore();
    const studentId =
      request.cookies.get(
        'edupath_student_id'
      )?.value;

    if (!studentId || studentId !== auth.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student session required.',
        },
        { status: 401 }
      );
    }

    const student =
      process.env.DATABASE_URL ? await getProductionStudentById(studentId) : findStudentById(studentId);

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student not found.',
        },
        { status: 404 }
      );
    }

    const demoBookings =
      process.env.DATABASE_URL
        ? await getProductionStudentDemoBookings(student.studentId)
        : getStudentDemoBookings(student.studentId);

    return NextResponse.json({
      success: true,
      demoBookings,
    });
  } catch (error) {
    console.error(
      'Student demos error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load demo bookings.',
      },
      { status: 500 }
    );
  }
}
