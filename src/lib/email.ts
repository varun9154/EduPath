import nodemailer from 'nodemailer';
import { LeadRecord, StudentRecord, DemoBookingRecord, leadStore } from './storage';

const adminEmailAddress = process.env.ADMIN_EMAIL || 'edupathadmin@gmail.com';
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: { user, pass },
    });
  }
  return null;
}

export async function sendRegistrationEmails(
  lead: LeadRecord,
  student: StudentRecord,
  booking: DemoBookingRecord
): Promise<{ adminEmailSent: boolean; studentEmailSent: boolean; mode: string }> {
  const transporter = getTransporter();
  const timestamp = new Date().toISOString();

  const adminSubject = `New EduPath Student Registration — ${student.name}`;
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #0c8de9; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #0c8de9; margin: 0;">EduPath Lead Notification 🎓</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">New registration captured from website</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1e293b;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Student ID:</td><td>${student.studentId}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Booking ID:</td><td>${booking.bookingId}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Full Name:</td><td style="font-weight: bold; color: #0f172a;">${student.name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td><td><a href="mailto:${student.email}" style="color: #0c8de9;">${student.email}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile:</td><td><a href="tel:${student.mobile}" style="color: #0c8de9;">${student.mobile}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Location:</td><td>${student.city}, ${student.state}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Education:</td><td>${student.educationLevel} (${student.stream})</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">10th / 12th Marks:</td><td>10th: ${student.marks10th} | 12th: ${student.marks12th}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Interested Course:</td><td style="color: #0c8de9; font-weight: bold;">${lead.interestedCourse}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Career Goal:</td><td>${lead.careerGoal}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Entrance Exam:</td><td>${lead.entranceExam}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Counselling Mode:</td><td>${booking.counsellingMode}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Requested Slot:</td><td>${booking.preferredDate} (${booking.preferredTimeSlot})</td></tr>
        </table>

        <div style="margin-top: 32px; text-align: center;">
          <a href="${appBaseUrl}/admin" style="display: inline-block; background-color: #0c8de9; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px;">
            Open Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  const studentSubject = `EduPath Registration Successful 🎓`;
  const studentHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; border-bottom: 2px solid #0c8de9; padding-bottom: 20px; margin-bottom: 24px;">
          <h1 style="color: #0c8de9; margin: 0; font-size: 24px;">EduPath</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">From 12th to Your First Job — We Show You the Path</p>
        </div>

        <p style="font-size: 16px; color: #1e293b;">Hi <strong>${student.name}</strong>,</p>

        <p style="font-size: 15px; color: #334155; line-height: 1.6;">
          Your EduPath registration and Free Demo session request have been successfully received 🎉
        </p>

        <div style="background-color: #f0f7ff; border-left: 4px solid #0c8de9; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Student ID:</strong> ${student.studentId}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Selected Goal:</strong> ${lead.interestedCourse}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Preferred Counselling Slot:</strong> ${booking.preferredDate} (${booking.preferredTimeSlot})</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Counselling Mode:</strong> ${booking.counsellingMode}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Booking Status:</strong> <span style="color: #d97706; font-weight: bold;">REQUEST RECEIVED</span></p>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Our EduPath expert counsellor will contact you shortly on <strong>${student.mobile}</strong> to confirm your personalized session and roadmap.
        </p>

        <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          Thank you for choosing EduPath.<br/>
          From 12th to Your First Job — We Show You the Path.
        </div>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'EduPath AI <noreply@edupath.in>',
        to: adminEmailAddress,
        subject: adminSubject,
        html: adminHtml,
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'EduPath AI <noreply@edupath.in>',
        to: student.email,
        subject: studentSubject,
        html: studentHtml,
      });

      leadStore.addNotificationLog({
        id: `NOTIF-ADM-${Date.now()}`,
        targetType: 'ADMIN_EMAIL',
        recipient: adminEmailAddress,
        messageSnippet: adminSubject,
        status: 'SENT',
        provider: 'Nodemailer SMTP',
        timestamp,
      });

      leadStore.addNotificationLog({
        id: `NOTIF-STU-${Date.now()}`,
        targetType: 'STUDENT_EMAIL',
        recipient: student.email,
        messageSnippet: studentSubject,
        status: 'SENT',
        provider: 'Nodemailer SMTP',
        timestamp,
      });

      return { adminEmailSent: true, studentEmailSent: true, mode: 'SMTP_LIVE' };
    } catch (err: unknown) {
      const errDetail = err instanceof Error ? err.message : 'SMTP dispatch error';
      leadStore.addNotificationLog({
        id: `NOTIF-FAIL-${Date.now()}`,
        targetType: 'ADMIN_EMAIL',
        recipient: adminEmailAddress,
        messageSnippet: adminSubject,
        status: 'FAILED',
        provider: 'Nodemailer SMTP',
        timestamp,
        errorDetail: errDetail,
      });
      return { adminEmailSent: false, studentEmailSent: false, mode: 'SMTP_ERROR' };
    }
  } else {
    // Development fallback logging
    leadStore.addNotificationLog({
      id: `NOTIF-DEV-ADM-${Date.now()}`,
      targetType: 'ADMIN_EMAIL',
      recipient: adminEmailAddress,
      messageSnippet: adminSubject,
      status: 'DEV_MODE',
      provider: 'Dev Mode Simulator',
      timestamp,
    });

    leadStore.addNotificationLog({
      id: `NOTIF-DEV-STU-${Date.now()}`,
      targetType: 'STUDENT_EMAIL',
      recipient: student.email,
      messageSnippet: studentSubject,
      status: 'DEV_MODE',
      provider: 'Dev Mode Simulator',
      timestamp,
    });

    return { adminEmailSent: true, studentEmailSent: true, mode: 'DEV_MODE' };
  }
}
