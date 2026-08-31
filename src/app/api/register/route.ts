// src/app/api/register/route.ts

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import {
  assertProductionDatabase,
  isDatabaseNotConfiguredError,
  isProductionDatabaseError,
  registerStudentBundle,
} from '@/lib/productionDb';

import type {
  StudentRecord,
  DemoBookingRecord,
  LeadRecord,
  CounsellingRecord,
} from '@/lib/storage';

import { sendRegistrationEmails } from '@/lib/email';
import { sendWhatsAppAndSmsNotifications } from '@/lib/notifications';
import {
  authManager,
  COOKIE_MAX_AGE,
} from '@/lib/auth';

/* =========================================================
   HELPERS
========================================================= */

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto
    .randomBytes(5)
    .toString('hex')}`;
}

function operationKey(
  request: Request,
  email: string,
  mobile: string
): string {
  const supplied =
    request.headers
      .get('idempotency-key')
      ?.trim();

  if (supplied) {
    return supplied.slice(0, 200);
  }

  return crypto
    .createHash('sha256')
    .update(
      `${email}|${mobile}|${new Date()
        .toISOString()
        .slice(0, 10)}`
    )
    .digest('hex');
}

function stringValue(
  value: unknown,
  fallback = ''
): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value);
  }

  return fallback;
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /*
     * =======================================================
     * DATABASE IS REQUIRED
     * =======================================================
     *
     * There is intentionally NO Excel fallback.
     *
     * Both local development and Render production use Neon.
     */
    assertProductionDatabase();

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const name =
      stringValue(body.name).trim();

    const email =
      stringValue(body.email)
        .trim()
        .toLowerCase();

    const mobile =
      stringValue(body.mobile).trim();

    const password =
      stringValue(body.password);

    if (!name || !email || !mobile) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Name, Email, and Mobile are required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      password &&
      password.length < 6
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must contain at least 6 characters.',
        },
        {
          status: 400,
        }
      );
    }

    const preferredDate =
      stringValue(
        body.preferredDate,
        new Date()
          .toISOString()
          .slice(0, 10)
      );

    const preferredTimeSlot =
      stringValue(
        body.preferredTimeSlot,
        '10:00 AM - 10:30 AM'
      );

    const now =
      new Date().toISOString();

    const studentId =
      makeId('EDU-STU');

    const bookingId =
      makeId('EDU-DEMO');

    const leadId =
      makeId('EDU-LEAD');

    /* =====================================================
       STUDENT
    ===================================================== */

    const student: StudentRecord = {
      studentId,

      name,

      email,

      mobile,

      educationLevel:
        stringValue(
          body.educationLevel,
          '10th / School Student'
        ),

      stream:
        stringValue(
          body.stream,
          'Not Selected'
        ),

      state:
        stringValue(
          body.state,
          'Karnataka'
        ),

      city:
        stringValue(
          body.city,
          'Bengaluru'
        ),

      marks10th:
        stringValue(
          body.marks10th,
          'N/A'
        ),

      marks12th:
        stringValue(
          body.marks12th,
          'N/A'
        ),

      registrationDate:
        now,

      registeredAt:
        now,

      updatedAt:
        now,

      status:
        'ACTIVE',

      passwordHash:
        password
          ? bcrypt.hashSync(
              password,
              12
            )
          : '',

      interestedCourse:
        stringValue(
          body.interestedCourse,
          'Career Guidance'
        ),

      careerGoal:
        stringValue(
          body.careerGoal,
          'Explore My Career Path'
        ),

      targetJob:
        stringValue(
          body.targetJob
        ),

      targetExam:
        stringValue(
          body.entranceExam
        ),

      leadSource:
        stringValue(
          body.leadSource,
          'EduPath Website'
        ),
    };

    /* =====================================================
       DEMO BOOKING
    ===================================================== */

    const booking:
      DemoBookingRecord = {
        bookingId,

        studentId,

        name,

        email,

        mobile,

        interestedCourse:
          String(
            student.interestedCourse ??
              ''
          ),

        counsellingMode:
          stringValue(
            body.counsellingMode,
            'Online Video Call'
          ),

        preferredDate,

        preferredTimeSlot,

        registrationDate:
          now,

        status:
          'REQUEST RECEIVED',
      };

    /* =====================================================
       LEAD
    ===================================================== */

    const lead: LeadRecord = {
      leadId,

      studentId,

      name,

      email,

      mobile,

      educationLevel:
        stringValue(
          student.educationLevel
        ),

      stream:
        stringValue(
          student.stream
        ),

      state:
        stringValue(
          student.state
        ),

      city:
        stringValue(
          student.city
        ),

      marks10th:
        stringValue(
          student.marks10th
        ),

      marks12th:
        stringValue(
          student.marks12th
        ),

      interestedCourse:
        stringValue(
          student.interestedCourse
        ),

      careerGoal:
        stringValue(
          student.careerGoal
        ),

      entranceExam:
        stringValue(
          student.targetExam
        ),

      counsellingMode:
        stringValue(
          booking.counsellingMode
        ),

      preferredDate,

      preferredTimeSlot,

      registrationDate:
        now,

      leadSource:
        stringValue(
          body.leadSource,
          'EduPath Website'
        ),

      status:
        'NEW',

      counsellor:
        'Unassigned',

      notes:
        `Demo requested for ${preferredDate} at ${preferredTimeSlot}.`,

      sheetsSyncStatus:
        'PENDING_SYNC',
    };

    /* =====================================================
       COUNSELLING
    ===================================================== */

    const counselling:
      CounsellingRecord = {
        sessionId:
          makeId('EDU-COUN'),

        studentId,

        name,

        preferredSlot:
          `${preferredDate} ${preferredTimeSlot}`,

        counsellor:
          'Unassigned',

        mode:
          stringValue(
            booking.counsellingMode
          ),

        notes:
          'Initial free demo session request.',

        outcome:
          'Pending Session',

        date:
          preferredDate,
      };

    /* =====================================================
       RESPONSE PAYLOAD
    ===================================================== */

    const responsePayload = {
      success: true,

      message:
        'Your EduPath registration has been received.',

      status:
        'REQUEST RECEIVED',

      notice:
        'Your requested slot is pending confirmation. Our counsellor will contact you.',

      data: {
        studentId,

        bookingId,

        leadId,

        name,

        email,

        mobile,

        storage:
          'Neon PostgreSQL',
      },
    };

    /* =====================================================
       NEON TRANSACTION
    ===================================================== */

    const registrationResult =
      await registerStudentBundle(
        {
          student,
          booking,
          lead,
          counselling,
        },
        operationKey(
          request,
          email,
          mobile
        ),
        responsePayload
      );

    /* =====================================================
       NOTIFICATIONS
       AFTER DURABLE DATABASE WRITE
    ===================================================== */

    let emailRes = {
      mode: 'NOT_ATTEMPTED',
    };

    let notifyRes = {
      adminNotifyStatus:
        'NOT_ATTEMPTED',
    };

    if (
      !registrationResult.replayed
    ) {
      try {
        emailRes =
          await sendRegistrationEmails(
            lead,
            student,
            booking
          );
      } catch (error) {
        console.error(
          'Registration email dispatch failed:',
          error
        );
      }

      try {
        notifyRes =
          await sendWhatsAppAndSmsNotifications(
            lead,
            student,
            booking
          );
      } catch (error) {
        console.error(
          'Registration messaging dispatch failed:',
          error
        );
      }
    }

    /* =====================================================
       CREATE STUDENT SESSION
    ===================================================== */

    const auth =
      password
        ? authManager.loginStudent(
            email,
            password,
            'Registration'
          )
        : null;

    const response =
      NextResponse.json({
        ...registrationResult.response,

        data: {
          ...(registrationResult.response
            .data as Record<
            string,
            unknown
          >),

          emailStatus:
            emailRes.mode,

          notificationStatus:
            notifyRes.adminNotifyStatus,

          replayed:
            registrationResult.replayed,
        },
      });

    /* =====================================================
       STUDENT COOKIES
    ===================================================== */

    if (
      auth?.success &&
      auth.sessionId
    ) {
      response.cookies.set(
        'edupath_student_sess',
        auth.sessionId,
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            'production',

          sameSite: 'lax',

          path: '/',

          maxAge:
            COOKIE_MAX_AGE,
        }
      );

      response.cookies.set(
        'edupath_student_id',
        studentId,
        {
          httpOnly: false,

          secure:
            process.env.NODE_ENV ===
            'production',

          sameSite: 'lax',

          path: '/',

          maxAge:
            COOKIE_MAX_AGE,
        }
      );
    }

    return response;
  } catch (error) {
    console.error(
      'Registration error:',
      error
    );

    if (
      isProductionDatabaseError(
        error,
        'DUPLICATE_STUDENT_EMAIL'
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A student account with this email already exists.',
        },
        {
          status: 409,
        }
      );
    }

    if (
      isProductionDatabaseError(
        error,
        'DUPLICATE_DEMO_SLOT'
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected counselling slot has already been reserved. Please choose another slot.',
        },
        {
          status: 409,
        }
      );
    }

    if (
      isDatabaseNotConfiguredError(
        error
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'DATABASE_URL is not configured. Add your Neon PostgreSQL connection string to .env.local.',
        },
        {
          status: 503,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Registration could not be completed. Please try again.',
      },
      {
        status: 500,
      }
    );
  }
}