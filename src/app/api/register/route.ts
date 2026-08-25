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
import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';
import {
  leadStore,
  StudentRecord,
  DemoBookingRecord,
  LeadRecord,
  CounsellingRecord,
} from '@/lib/storage';
import { sendRegistrationEmails } from '@/lib/email';
import { sendWhatsAppAndSmsNotifications } from '@/lib/notifications';
import { authManager, COOKIE_MAX_AGE } from '@/lib/auth';

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
}

function operationKey(req: Request, email: string, mobile: string): string {
  const supplied = req.headers.get('idempotency-key')?.trim();
  if (supplied) return supplied.slice(0, 200);

  return crypto
    .createHash('sha256')
    .update(`${email}|${mobile}|${new Date().toISOString().slice(0, 10)}`)
    .digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const mobile = String(body?.mobile || '').trim();
    const password = String(body?.password || '');

    if (!name || !email || !mobile) {
      return NextResponse.json(
        { success: false, message: 'Name, Email, and Mobile are required.' },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must contain at least 6 characters.' },
        { status: 400 }
      );
    }

    const preferredDate = String(body?.preferredDate || new Date().toISOString().slice(0, 10));
    const preferredTimeSlot = String(body?.preferredTimeSlot || '10:00 AM - 10:30 AM');
    const now = new Date().toISOString();

    const studentId = id('EDU-STU');
    const bookingId = id('EDU-DEMO');
    const leadId = id('EDU-LEAD');

    const student: StudentRecord = {
      studentId,
      name,
      email,
      mobile,
      educationLevel: String(body?.educationLevel || '10th / School Student'),
      stream: String(body?.stream || 'Not Selected'),
      state: String(body?.state || 'Karnataka'),
      city: String(body?.city || 'Bengaluru'),
      marks10th: String(body?.marks10th || 'N/A'),
      marks12th: String(body?.marks12th || 'N/A'),
      registrationDate: now,
      registeredAt: now,
      updatedAt: now,
      status: 'ACTIVE',
      passwordHash: password ? bcrypt.hashSync(password, 12) : '',
      interestedCourse: String(body?.interestedCourse || 'Career Guidance'),
      careerGoal: String(body?.careerGoal || 'Explore My Career Path'),
      targetJob: String(body?.targetJob || ''),
      targetExam: String(body?.entranceExam || ''),
      leadSource: String(body?.leadSource || 'EduPath Website'),
    };

    const booking: DemoBookingRecord = {
      bookingId,
      studentId,
      name,
      email,
      mobile,
      interestedCourse: String(student.interestedCourse ?? ''),
      counsellingMode: String(body?.counsellingMode || 'Online Video Call'),
      preferredDate,
      preferredTimeSlot,
      registrationDate: now,
      status: 'REQUEST RECEIVED',
    };

    const lead: LeadRecord = {
      leadId,
      studentId,
      name,
      email,
      mobile,
      educationLevel: student.educationLevel || '',
      stream: student.stream || '',
      state: student.state || '',
      city: student.city || '',
      marks10th: String(student.marks10th || ''),
      marks12th: String(student.marks12th || ''),
      interestedCourse: String(student.interestedCourse || ''),
      careerGoal: String(student.careerGoal || ''),
      entranceExam: String(student.targetExam || ''),
      counsellingMode: booking.counsellingMode || '',
      preferredDate,
      preferredTimeSlot,
      registrationDate: now,
      leadSource: String(body?.leadSource || 'EduPath Website'),
      status: 'NEW',
      counsellor: 'Unassigned',
      notes: `Demo requested for ${preferredDate} at ${preferredTimeSlot}.`,
      sheetsSyncStatus: 'PENDING_SYNC',
    };

    const counselling: CounsellingRecord = {
      sessionId: id('EDU-COUN'),
      studentId,
      name,
      preferredSlot: `${preferredDate} ${preferredTimeSlot}`,
      counsellor: 'Unassigned',
      mode: booking.counsellingMode || '',
      notes: 'Initial free demo session request.',
      outcome: 'Pending Session',
      date: preferredDate,
    };

    const responsePayload = {
      success: true,
      message: 'Your EduPath registration has been received.',
      status: 'REQUEST RECEIVED',
      notice: 'Your requested slot is pending confirmation. Our counsellor will contact you.',
      data: {
        studentId,
        bookingId,
        leadId,
        name,
        email,
        mobile,
        storage: 'Neon PostgreSQL',
      },
    };

    let registrationResult;

    if (process.env.DATABASE_URL) {
      assertProductionDatabase();
      registrationResult = await registerStudentBundle(
        { student, booking, lead, counselling },
        operationKey(req, email, mobile),
        responsePayload
      );
    } else if (process.env.NODE_ENV !== 'production') {
      // Local-only compatibility mode. Production never uses the workbook as
      // its source of truth anymore.
      await prepareExcelStore();
      if (leadStore.getStudentByEmail(email)) {
        return NextResponse.json(
          { success: false, message: 'A student account with this email already exists.' },
          { status: 409 }
        );
      }
      if (leadStore.isSlotBooked(preferredDate, preferredTimeSlot)) {
        return NextResponse.json(
          { success: false, message: `The selected time slot (${preferredTimeSlot} on ${preferredDate}) has already been reserved. Please choose another slot.` },
          { status: 409 }
        );
      }
      leadStore.addStudent(student);
      leadStore.addDemoBooking(booking);
      leadStore.addLead(lead);
      leadStore.addCounsellingRecord(counselling);
      await persistExcelStore();
      registrationResult = { replayed: false, studentId, bookingId, leadId, response: responsePayload };
    } else {
      throw new Error('EDUPATH_DATABASE_NOT_CONFIGURED: DATABASE_URL is required in production.');
    }

    // Notifications are deliberately AFTER durable persistence. A provider
    // outage must never roll back or lose a student registration.
    let emailRes = { mode: 'NOT_ATTEMPTED' } as { mode: string };
    let notifyRes = { adminNotifyStatus: 'NOT_ATTEMPTED' } as { adminNotifyStatus: string };

    if (!registrationResult.replayed) {
      try {
        emailRes = await sendRegistrationEmails(lead, student, booking);
      } catch (error) {
        console.error('Registration email dispatch failed after persistence:', error);
      }

      try {
        notifyRes = await sendWhatsAppAndSmsNotifications(lead, student, booking);
      } catch (error) {
        console.error('Registration messaging dispatch failed after persistence:', error);
      }
    }

    const auth = password ? await authManager.loginStudentAsync(email, password, 'Registration') : null;
    const response = NextResponse.json({
      ...registrationResult.response,
      data: {
        ...(registrationResult.response.data as Record<string, unknown>),
        emailStatus: emailRes.mode,
        notificationStatus: notifyRes.adminNotifyStatus,
        replayed: registrationResult.replayed,
      },
    });

    if (auth?.success && auth.sessionId) {
      response.cookies.set('edupath_student_sess', auth.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
      response.cookies.set('edupath_student_id', studentId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error) {
    console.error('Registration error:', error);

    if (isProductionDatabaseError(error, 'DUPLICATE_STUDENT_EMAIL')) {
      return NextResponse.json(
        { success: false, message: 'A student account with this email already exists.' },
        { status: 409 }
      );
    }

    if (isProductionDatabaseError(error, 'DUPLICATE_DEMO_SLOT')) {
      return NextResponse.json(
        { success: false, message: 'The selected counselling slot has already been reserved. Please choose another slot.' },
        { status: 409 }
      );
    }

    if (isDatabaseNotConfiguredError(error)) {
      return NextResponse.json(
        { success: false, message: 'Registration is temporarily unavailable while production storage is being configured. Please try again shortly.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Registration could not be completed. Please try again.' },
      { status: 500 }
    );
  }
}
