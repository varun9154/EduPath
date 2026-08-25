export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { leadStore, StudentRecord, DemoBookingRecord, LeadRecord, CounsellingRecord } from '@/lib/storage';
import { sendRegistrationEmails } from '@/lib/email';
import { sendWhatsAppAndSmsNotifications } from '@/lib/notifications';
import { authManager, COOKIE_MAX_AGE } from '@/lib/auth';

function id(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export async function POST(req: Request) {
  try {
    await prepareExcelStore();
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const mobile = String(body?.mobile || '').trim();
    const password = String(body?.password || '');

    if (!name || !email || !mobile) return NextResponse.json({ success: false, message: 'Name, Email, and Mobile are required.' }, { status: 400 });
    if (password && password.length < 6) return NextResponse.json({ success: false, message: 'Password must contain at least 6 characters.' }, { status: 400 });
    if (leadStore.getStudentByEmail(email)) return NextResponse.json({ success: false, message: 'A student account with this email already exists.' }, { status: 409 });

    const preferredDate = String(body?.preferredDate || new Date().toISOString().slice(0, 10));
    const preferredTimeSlot = String(body?.preferredTimeSlot || '10:00 AM - 10:30 AM');
    if (leadStore.isSlotBooked(preferredDate, preferredTimeSlot)) return NextResponse.json({ success: false, message: `The selected time slot (${preferredTimeSlot} on ${preferredDate}) has already been reserved. Please choose another slot.` }, { status: 409 });

    const studentId = id('EDU-STU');
    const bookingId = id('EDU-DEMO');
    const leadId = id('EDU-LEAD');
    const now = new Date().toISOString();

    const student: StudentRecord = {
      studentId, name, email, mobile,
      educationLevel: String(body?.educationLevel || '12th Appearing'),
      stream: String(body?.stream || 'Science (PCM)'),
      state: String(body?.state || 'Karnataka'), city: String(body?.city || 'Bengaluru'),
      marks10th: String(body?.marks10th || 'N/A'), marks12th: String(body?.marks12th || 'N/A'),
      registrationDate: now, registeredAt: now, updatedAt: now,
      status: 'ACTIVE', passwordHash: password ? bcrypt.hashSync(password, 12) : '',
      interestedCourse: String(body?.interestedCourse || 'B.Tech Computer Science'),
      careerGoal: String(body?.careerGoal || 'Software Development Engineer'),
      targetJob: String(body?.targetJob || ''),
      targetExam: String(body?.entranceExam || 'KCET'),
    };

    const booking: DemoBookingRecord = {
      bookingId, studentId, name, email, mobile,
      interestedCourse: String(student.interestedCourse ?? ''), counsellingMode: String(body?.counsellingMode || 'Online Video Call'),
      preferredDate, preferredTimeSlot, registrationDate: now, status: 'REQUEST RECEIVED',
    };

    const lead: LeadRecord = {
      leadId, studentId, name, email, mobile,
      educationLevel: student.educationLevel || '', stream: student.stream || '', state: student.state || '', city: student.city || '',
      marks10th: String(student.marks10th || ''), marks12th: String(student.marks12th || ''),
      interestedCourse: String(student.interestedCourse || ''), careerGoal: String(student.careerGoal || ''), entranceExam: String(student.targetExam || ''),
      counsellingMode: booking.counsellingMode || '', preferredDate, preferredTimeSlot, registrationDate: now,
      leadSource: String(body?.leadSource || 'EduPath Website'), status: 'NEW', counsellor: 'Unassigned',
      notes: `Demo requested for ${preferredDate} at ${preferredTimeSlot}.`, sheetsSyncStatus: 'PENDING_SYNC',
    };

    const counselling: CounsellingRecord = { sessionId: id('EDU-COUN'), studentId, name, preferredSlot: `${preferredDate} ${preferredTimeSlot}`, counsellor: 'Unassigned', mode: booking.counsellingMode || '', notes: 'Initial free demo session request.', outcome: 'Pending Session', date: preferredDate };

    leadStore.addStudent(student);
    leadStore.addDemoBooking(booking);
    leadStore.addLead(lead);
    leadStore.addCounsellingRecord(counselling);
    await persistExcelStore();

    const emailRes = await sendRegistrationEmails(lead, student, booking);
    const notifyRes = await sendWhatsAppAndSmsNotifications(lead, student, booking);
    try { await persistExcelStore(); } catch (storageError) { console.error('Notification log persistence failed:', storageError); }

    const auth = password ? authManager.loginStudent(email, password, 'Registration') : null;
    const response = NextResponse.json({ success: true, message: 'Your EduPath registration has been received.', status: 'REQUEST RECEIVED', notice: 'Your requested slot is pending confirmation. Our counsellor will contact you.', data: { studentId, bookingId, leadId, name, email, mobile, emailStatus: emailRes.mode, notificationStatus: notifyRes.adminNotifyStatus, storage: 'Excel' } });
    if (auth?.success && auth.sessionId) {
      response.cookies.set('edupath_student_sess', auth.sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE });
      response.cookies.set('edupath_student_id', studentId, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE });
    }
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Registration failed.' }, { status: 500 });
  }
}
