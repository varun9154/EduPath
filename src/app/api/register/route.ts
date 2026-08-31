import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authManager, COOKIE_MAX_AGE } from '@/lib/auth';
import { leadStore, StudentRecord, DemoBookingRecord, LeadRecord, CounsellingRecord } from '@/lib/storage';
import { syncLeadToGoogleSheets, ensureHeaders, appendRow } from '@/lib/googleSheets';
import { sendRegistrationEmails } from '@/lib/email';
import { sendWhatsAppAndSmsNotifications } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      mobile,
      educationLevel = '12th Appearing',
      stream = 'Science (PCM)',
      state = 'Karnataka',
      city = 'Bengaluru',
      marks10th = 'N/A',
      marks12th = 'N/A',
      password = '',
      interestedCourse = 'B.Tech Computer Science',
      careerGoal = 'Software Development Engineer',
      entranceExam = 'KCET',
      counsellingMode = 'Online Video Call',
      preferredDate = new Date().toISOString().split('T')[0],
      preferredTimeSlot = '10:00 AM – 10:30 AM',
      leadSource = 'EduPath Website Form'
    } = body;

    // Basic Validation
    if (!name || !email || !mobile || !password) {
      return NextResponse.json({ success: false, message: 'Name, Email, and Mobile are required.' }, { status: 400 });
    }

    // Anti-Double Booking Validation
    if (leadStore.isSlotBooked(preferredDate, preferredTimeSlot)) {
      return NextResponse.json({
        success: false,
        message: `The selected time slot (${preferredTimeSlot} on ${preferredDate}) has already been reserved. Please choose another slot.`
      }, { status: 409 });
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const studentId = `EDU-STU-${randomSuffix}`;
    const bookingId = `EDU-DEMO-${randomSuffix}`;
    const leadId = `EDU-LEAD-${randomSuffix}`;
    const now = new Date().toISOString();

    const student: StudentRecord = {
      studentId,
      name,
      email,
      mobile,
      password: bcrypt.hashSync(String(password), 12),
      educationLevel,
      stream,
      state,
      city,
      marks10th,
      marks12th,
      registrationDate: now
    };

    const booking: DemoBookingRecord = {
      bookingId,
      studentId,
      name,
      email,
      mobile,
      interestedCourse,
      counsellingMode,
      preferredDate,
      preferredTimeSlot,
      registrationDate: now,
      status: 'REQUEST RECEIVED'
    };

    const lead: LeadRecord = {
      leadId,
      studentId,
      name,
      email,
      mobile,
      educationLevel,
      stream,
      state,
      city,
      marks10th,
      marks12th,
      interestedCourse,
      careerGoal,
      entranceExam,
      counsellingMode,
      preferredDate,
      preferredTimeSlot,
      registrationDate: now,
      leadSource,
      status: 'NEW',
      counsellor: 'Unassigned',
      notes: `Demo booked for ${preferredDate} at ${preferredTimeSlot}. Mode: ${counsellingMode}`,
      sheetsSyncStatus: 'PENDING_SYNC'
    };

    const counsellingSession: CounsellingRecord = {
      sessionId: `EDU-COUN-${randomSuffix}`,
      studentId,
      name,
      preferredSlot: `${preferredDate} ${preferredTimeSlot}`,
      counsellor: 'Unassigned',
      mode: counsellingMode,
      notes: 'Initial free demo session request.',
      outcome: 'Pending Session',
      date: preferredDate
    };

    // Save to global serverless buffer
    // Persist each entity to Google Sheets. If any operation fails, keep the record in the in‑memory store for later retry.
    await ensureHeaders('Students', ['studentId', 'name', 'email', 'mobile', 'educationLevel', 'stream', 'state', 'city', 'marks10th', 'marks12th', 'registrationDate']);
    await ensureHeaders('DemoBookings', ['bookingId', 'studentId', 'name', 'email', 'mobile', 'interestedCourse', 'counsellingMode', 'preferredDate', 'preferredTimeSlot', 'registrationDate', 'status']);
    await ensureHeaders('Leads', ['leadId', 'studentId', 'name', 'email', 'mobile', 'educationLevel', 'stream', 'state', 'city', 'marks10th', 'marks12th', 'interestedCourse', 'careerGoal', 'entranceExam', 'counsellingMode', 'preferredDate', 'preferredTimeSlot', 'registrationDate', 'leadSource', 'status', 'counsellor', 'notes']);
    await ensureHeaders('Counselling', ['sessionId', 'studentId', 'name', 'preferredSlot', 'counsellor', 'mode', 'notes', 'outcome', 'date']);

    const studentResult = await appendRow('Students', [student.studentId, student.name, student.email, student.mobile, student.educationLevel, student.stream, student.state, student.city, student.marks10th, student.marks12th, student.registrationDate]);
    if (!studentResult.success) leadStore.addStudent(student);

    const bookingResult = await appendRow('DemoBookings', [booking.bookingId, booking.studentId, booking.name, booking.email, booking.mobile, booking.interestedCourse, booking.counsellingMode, booking.preferredDate, booking.preferredTimeSlot, booking.registrationDate, booking.status]);
    if (!bookingResult.success) leadStore.addDemoBooking(booking);

    const leadResult = await appendRow('Leads', [lead.leadId, lead.studentId, lead.name, lead.email, lead.mobile, lead.educationLevel, lead.stream, lead.state, lead.city, lead.marks10th, lead.marks12th, lead.interestedCourse, lead.careerGoal, lead.entranceExam, lead.counsellingMode, lead.preferredDate, lead.preferredTimeSlot, lead.registrationDate, lead.leadSource, lead.status, lead.counsellor, lead.notes]);
    if (!leadResult.success) leadStore.addLead(lead);

    const counsellingResult = await appendRow('Counselling', [counsellingSession.sessionId, counsellingSession.studentId, counsellingSession.name, counsellingSession.preferredSlot, counsellingSession.counsellor, counsellingSession.mode, counsellingSession.notes, counsellingSession.outcome, counsellingSession.date]);
    if (!counsellingResult.success) leadStore.addCounsellingRecord(counsellingSession);

    const auth = authManager.createStudentSession(
      studentId,
      email,
      name,
      'Registration'
    );

    // Asynchronous notifications & cloud synchronization
    const emailRes = await sendRegistrationEmails(lead, student, booking);
    const notifyRes = await sendWhatsAppAndSmsNotifications(lead, student, booking);
    const sheetsRes = await syncLeadToGoogleSheets(lead, student, booking);

    const response = NextResponse.json({
      success: true,
      message: 'Your Free EduPath Demo Request Has Been Received 🎉',
      status: 'REQUEST RECEIVED',
      notice: 'Your requested slot is pending confirmation. Our counsellor will contact you.',
      data: {
        studentId,
        bookingId,
        leadId,
        name,
        email,
        mobile,
        interestedCourse,
        careerGoal,
        entranceExam,
        counsellingMode,
        preferredDate,
        preferredTimeSlot,
        emailStatus: emailRes.mode,
        notificationStatus: notifyRes.adminNotifyStatus,
        sheetsSyncMessage: sheetsRes.message
      }
    });

    if (auth.success && auth.sessionId) {
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

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
