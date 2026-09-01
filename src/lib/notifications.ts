import {
  LeadRecord,
  StudentRecord,
  DemoBookingRecord,
  CounsellorRecord,
  leadStore,
} from './storage';
import { appendRow } from '@/lib/googleSheets';

type NotificationStatus =
  | 'SENT'
  | 'PENDING'
  | 'FAILED'
  | 'DEV_MODE'
  | 'NOT_CONFIGURED';

type NotificationResult = {
  adminNotifyStatus: NotificationStatus;
  studentNotifyStatus: NotificationStatus;
};

/**
 * ============================================================
 * SEND WHATSAPP + SMS FOR STUDENT REGISTRATION
 * ============================================================
 */
export async function sendStudentRegistrationNotifications(
  student: StudentRecord
): Promise<{
  whatsappStatus: NotificationStatus;
  smsStatus: NotificationStatus;
}> {
  const timestamp = new Date().toISOString();

  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const studentPhone = student.mobile.replace(/[^\d]/g, '');

  const studentWhatsAppMessage = `Hi ${student.name} 👋

Thanks for registering with EduPath! 🎓

Your student account has been successfully created.

You can now access:
• Courses & Career Guidance
• Entrance Exams
• Career Roadmaps
• Scholarships
• Resources
• AI Counsellor

Welcome to EduPath — From 10th to Your First Job.

Thank you for choosing EduPath AI.`;

  const studentSmsMessage =
    `Hi ${student.name}, thanks for registering with EduPath! ` +
    `Your student account has been successfully created. ` +
    `Welcome to EduPath AI - From 10th to Your First Job.`;

  let whatsappStatus: NotificationStatus = 'DEV_MODE';
  let smsStatus: NotificationStatus = 'DEV_MODE';

  /* ==========================================================
     WHATSAPP
     ========================================================== */

  if (whatsappToken && whatsappPhoneId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: studentPhone,
            type: 'text',
            text: {
              body: studentWhatsAppMessage,
            },
          }),
        }
      );

      if (response.ok) {
        whatsappStatus = 'SENT';

        const log = {
          id: `NOTIF-WA-REG-${Date.now()}`,
          targetType: 'STUDENT_WHATSAPP' as const,
          recipient: student.mobile,
          messageSnippet:
            `Thanks for registering with EduPath — ${student.name}`,
          status: 'SENT' as const,
          provider: 'Meta WhatsApp Cloud API',
          timestamp,
        };

        leadStore.addNotificationLog(log);

        await appendRow('NotificationLogs', [
          log.id,
          log.targetType,
          log.recipient,
          log.messageSnippet,
          log.status,
          log.provider,
          log.timestamp,
          '',
        ]);
      } else {
        whatsappStatus = 'FAILED';

        const errorText = await response.text();

        const log = {
          id: `NOTIF-WA-REG-ERR-${Date.now()}`,
          targetType: 'STUDENT_WHATSAPP' as const,
          recipient: student.mobile,
          messageSnippet:
            `Registration WhatsApp failed — ${student.name}`,
          status: 'FAILED' as const,
          provider: 'Meta WhatsApp Cloud API',
          timestamp,
          errorDetail: errorText,
        };

        leadStore.addNotificationLog(log);
      }
    } catch (error: unknown) {
      whatsappStatus = 'FAILED';

      const errorDetail =
        error instanceof Error
          ? error.message
          : 'WhatsApp network error';

      leadStore.addNotificationLog({
        id: `NOTIF-WA-REG-ERR-${Date.now()}`,
        targetType: 'STUDENT_WHATSAPP',
        recipient: student.mobile,
        messageSnippet:
          `Registration WhatsApp failed — ${student.name}`,
        status: 'FAILED',
        provider: 'Meta WhatsApp Cloud API',
        timestamp,
        errorDetail,
      });
    }
  } else {
    /* ========================================================
       WHATSAPP DEVELOPMENT MODE
       ======================================================== */

    leadStore.addNotificationLog({
      id: `NOTIF-DEV-WA-REG-${Date.now()}`,
      targetType: 'STUDENT_WHATSAPP',
      recipient: student.mobile,
      messageSnippet:
        `Thanks for registering with EduPath — ${student.name}`,
      status: 'DEV_MODE',
      provider: 'Meta WhatsApp Cloud API',
      timestamp,
    });
  }

  /* ==========================================================
     SMS USING TWILIO
     ========================================================== */

  if (
    twilioAccountSid &&
    twilioAuthToken &&
    twilioPhoneNumber
  ) {
    try {
      const credentials = Buffer.from(
        `${twilioAccountSid}:${twilioAuthToken}`
      ).toString('base64');

      const params = new URLSearchParams();

      params.append('To', `+${studentPhone}`);
      params.append('From', twilioPhoneNumber);
      params.append('Body', studentSmsMessage);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (response.ok) {
        smsStatus = 'SENT';

        const log = {
          id: `NOTIF-SMS-REG-${Date.now()}`,
          targetType: 'STUDENT_SMS' as const,
          recipient: student.mobile,
          messageSnippet:
            `Thanks for registering with EduPath — ${student.name}`,
          status: 'SENT' as const,
          provider: 'Twilio SMS',
          timestamp,
        };

        leadStore.addNotificationLog(log);

        await appendRow('NotificationLogs', [
          log.id,
          log.targetType,
          log.recipient,
          log.messageSnippet,
          log.status,
          log.provider,
          log.timestamp,
          '',
        ]);
      } else {
        smsStatus = 'FAILED';

        const errorText = await response.text();

        leadStore.addNotificationLog({
          id: `NOTIF-SMS-REG-ERR-${Date.now()}`,
          targetType: 'STUDENT_SMS',
          recipient: student.mobile,
          messageSnippet:
            `Registration SMS failed — ${student.name}`,
          status: 'FAILED',
          provider: 'Twilio SMS',
          timestamp,
          errorDetail: errorText,
        });
      }
    } catch (error: unknown) {
      smsStatus = 'FAILED';

      const errorDetail =
        error instanceof Error
          ? error.message
          : 'SMS network error';

      leadStore.addNotificationLog({
        id: `NOTIF-SMS-REG-ERR-${Date.now()}`,
        targetType: 'STUDENT_SMS',
        recipient: student.mobile,
        messageSnippet:
          `Registration SMS failed — ${student.name}`,
        status: 'FAILED',
        provider: 'Twilio SMS',
        timestamp,
        errorDetail,
      });
    }
  } else {
    /* ========================================================
       SMS DEVELOPMENT MODE
       ======================================================== */

    leadStore.addNotificationLog({
      id: `NOTIF-DEV-SMS-REG-${Date.now()}`,
      targetType: 'STUDENT_SMS',
      recipient: student.mobile,
      messageSnippet:
        `Thanks for registering with EduPath — ${student.name}`,
      status: 'DEV_MODE',
      provider: 'Twilio SMS',
      timestamp,
    });
  }

  return {
    whatsappStatus,
    smsStatus,
  };
}


/**
 * ============================================================
 * EXISTING DEMO BOOKING NOTIFICATIONS
 * ============================================================
 */
export async function sendWhatsAppAndSmsNotifications(
  lead: LeadRecord,
  student: StudentRecord,
  booking: DemoBookingRecord
): Promise<NotificationResult> {
  const adminPhone =
    process.env.ADMIN_PHONE || '+919154422624';

  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const timestamp = new Date().toISOString();

  const adminMessage = `NEW EDUPATH LEAD 🎓

Student:
${student.name}

Mobile:
${student.mobile}

Email:
${student.email}

State:
${student.state}

Course:
${lead.interestedCourse}

Exam:
${lead.entranceExam}

Demo:
${booking.preferredDate} — ${booking.preferredTimeSlot}

Lead ID:
${lead.leadId}

Open Admin Dashboard:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`;

  const studentMessage = `Hi ${student.name} 👋

Your EduPath FREE Demo request has been successfully registered.

Booking ID:
${booking.bookingId}

Date:
${booking.preferredDate}

Time:
${booking.preferredTimeSlot}

Mode:
${booking.counsellingMode}

Status: REQUEST RECEIVED

Our counsellor will contact you to confirm the slot.

EduPath AI
From 10th to Your First Job.`;

  if (whatsappToken && whatsappPhoneId) {
    try {
      /* ======================================================
         ADMIN WHATSAPP
         ====================================================== */

      const adminResponse = await fetch(
        `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: adminPhone.replace(/[^\d]/g, ''),
            type: 'text',
            text: {
              body: adminMessage,
            },
          }),
        }
      );

      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();

        leadStore.addNotificationLog({
          id: `NOTIF-WA-ERR-${Date.now()}`,
          targetType: 'ADMIN_WHATSAPP',
          recipient: adminPhone,
          messageSnippet: adminMessage,
          status: 'FAILED',
          provider: 'Meta WhatsApp Cloud API',
          timestamp,
          errorDetail: errorText,
        });

        return {
          adminNotifyStatus: 'FAILED',
          studentNotifyStatus: 'FAILED',
        };
      }

      leadStore.addNotificationLog({
        id: `NOTIF-WA-ADM-${Date.now()}`,
        targetType: 'ADMIN_WHATSAPP',
        recipient: adminPhone,
        messageSnippet:
          `NEW EDUPATH LEAD 🎓 — ${student.name}`,
        status: 'SENT',
        provider: 'Meta WhatsApp Cloud API',
        timestamp,
      });

      /* ======================================================
         STUDENT WHATSAPP
         ====================================================== */

      const studentResponse = await fetch(
        `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: student.mobile.replace(/[^\d]/g, ''),
            type: 'text',
            text: {
              body: studentMessage,
            },
          }),
        }
      );

      if (!studentResponse.ok) {
        const errorText = await studentResponse.text();

        leadStore.addNotificationLog({
          id: `NOTIF-WA-STU-ERR-${Date.now()}`,
          targetType: 'STUDENT_WHATSAPP',
          recipient: student.mobile,
          messageSnippet: studentMessage,
          status: 'FAILED',
          provider: 'Meta WhatsApp Cloud API',
          timestamp,
          errorDetail: errorText,
        });

        return {
          adminNotifyStatus: 'SENT',
          studentNotifyStatus: 'FAILED',
        };
      }

      leadStore.addNotificationLog({
        id: `NOTIF-WA-STU-${Date.now()}`,
        targetType: 'STUDENT_WHATSAPP',
        recipient: student.mobile,
        messageSnippet:
          `EduPath FREE Demo request registered — ${booking.bookingId}`,
        status: 'SENT',
        provider: 'Meta WhatsApp Cloud API',
        timestamp,
      });

      return {
        adminNotifyStatus: 'SENT',
        studentNotifyStatus: 'SENT',
      };
    } catch (error: unknown) {
      const errorDetail =
        error instanceof Error
          ? error.message
          : 'Network error';

      leadStore.addNotificationLog({
        id: `NOTIF-WA-ERR-${Date.now()}`,
        targetType: 'ADMIN_WHATSAPP',
        recipient: adminPhone,
        messageSnippet: adminMessage,
        status: 'FAILED',
        provider: 'Meta WhatsApp Cloud API',
        timestamp,
        errorDetail,
      });

      return {
        adminNotifyStatus: 'FAILED',
        studentNotifyStatus: 'FAILED',
      };
    }
  }

  /* ==========================================================
     DEVELOPMENT MODE
     ========================================================== */

  leadStore.addNotificationLog({
    id: `NOTIF-DEV-WA-ADM-${Date.now()}`,
    targetType: 'ADMIN_WHATSAPP',
    recipient: adminPhone,
    messageSnippet:
      `NEW EDUPATH LEAD 🎓 — ${student.name}`,
    status: 'DEV_MODE',
    provider: 'WhatsApp / Twilio Simulator',
    timestamp,
  });

  leadStore.addNotificationLog({
    id: `NOTIF-DEV-WA-STU-${Date.now()}`,
    targetType: 'STUDENT_WHATSAPP',
    recipient: student.mobile,
    messageSnippet:
      `EduPath FREE Demo request registered — ${booking.bookingId}`,
    status: 'DEV_MODE',
    provider: 'WhatsApp / Twilio Simulator',
    timestamp,
  });

  return {
    adminNotifyStatus: 'DEV_MODE',
    studentNotifyStatus: 'DEV_MODE',
  };
}

/**
 * ============================================================
 * SEND COUNSELLOR ASSIGNMENT NOTIFICATION
 * ============================================================
 *
 * Send email and SMS to student when counsellor is assigned.
 */
export async function sendCounsellorAssignmentNotification(
  student: StudentRecord,
  booking: DemoBookingRecord,
  counsellor: CounsellorRecord
): Promise<{
  emailStatus: NotificationStatus;
  smsStatus: NotificationStatus;
}> {
  const timestamp = new Date().toISOString();

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@edupath.ai';

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const studentPhone = student.mobile.replace(/[^\d]/g, '');

  let emailStatus: NotificationStatus = 'DEV_MODE';
  let smsStatus: NotificationStatus = 'DEV_MODE';

  /* ==========================================================
     EMAIL
     ========================================================== */

  if (smtpHost && smtpUser && smtpPass && smtpPort) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const emailBody = `
Dear ${student.name},

Your EduPath counselling session has been assigned!

🎓 Session Details:
Student ID: ${student.studentId}
Counsellor: ${counsellor.name}
Date: ${booking.preferredDate || 'To be confirmed'}
Time: ${booking.preferredTimeSlot || 'To be confirmed'}
Mode: ${booking.counsellingMode || 'Online Video Call'}
Booking ID: ${booking.bookingId}

Status: CONFIRMED ✓

You may contact EduPath support at support@edupath.ai if you need assistance.

Best regards,
EduPath Team
From 10th to Your First Job 🚀
`;

      await transporter.sendMail({
        from: smtpFrom,
        to: student.email,
        subject: `EduPath Counsellor Assigned — ${booking.bookingId}`,
        text: emailBody,
      });

      emailStatus = 'SENT';

      // Log notification
      if (process.env.DATABASE_URL) {
        const { addNotificationLog } = await import('@/lib/productionDb');
        await addNotificationLog({
          id: `NOTIF-EMAIL-ASSIGN-${Date.now()}`,
          targetType: 'STUDENT_EMAIL',
          recipient: student.email,
          messageSnippet: `Counsellor ${counsellor.name} assigned to booking ${booking.bookingId}`,
          status: 'SENT',
          provider: 'Nodemailer/SMTP',
          timestamp,
        });
      } else {
        leadStore.addNotificationLog({
          id: `NOTIF-EMAIL-ASSIGN-${Date.now()}`,
          targetType: 'STUDENT_EMAIL',
          recipient: student.email,
          messageSnippet: `Counsellor ${counsellor.name} assigned`,
          status: 'SENT',
          provider: 'Nodemailer/SMTP',
          timestamp,
        });
      }
    } catch (error) {
      console.error('Email error:', error);
      emailStatus = 'FAILED';

      if (process.env.DATABASE_URL) {
        const { addNotificationLog } = await import('@/lib/productionDb');
        await addNotificationLog({
          id: `NOTIF-EMAIL-FAIL-${Date.now()}`,
          targetType: 'STUDENT_EMAIL',
          recipient: student.email,
          messageSnippet: `Failed to send counsellor assignment`,
          status: 'FAILED',
          provider: 'Nodemailer/SMTP',
          timestamp,
          errorDetail: String(error),
        });
      }
    }
  } else {
    emailStatus = 'NOT_CONFIGURED';
  }

  /* ==========================================================
     SMS
     ========================================================== */

  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const smsBody = `EduPath: Hi ${student.name}, your EduPath demo ${booking.bookingId} is confirmed with ${counsellor.name} on ${booking.preferredDate} at ${booking.preferredTimeSlot}. Mode: ${booking.counsellingMode}.`;

      const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + twilioAccountSid + '/Messages.json', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(twilioAccountSid + ':' + twilioAuthToken).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: studentPhone,
          Body: smsBody,
        }).toString(),
      });

      if (response.ok) {
        smsStatus = 'SENT';

        if (process.env.DATABASE_URL) {
          const { addNotificationLog } = await import('@/lib/productionDb');
          await addNotificationLog({
            id: `NOTIF-SMS-ASSIGN-${Date.now()}`,
            targetType: 'STUDENT_SMS',
            recipient: student.mobile,
            messageSnippet: `Counsellor assigned - ${booking.bookingId}`,
            status: 'SENT',
            provider: 'Twilio',
            timestamp,
          });
        } else {
          leadStore.addNotificationLog({
            id: `NOTIF-SMS-ASSIGN-${Date.now()}`,
            targetType: 'STUDENT_SMS',
            recipient: student.mobile,
            messageSnippet: `Counsellor assigned`,
            status: 'SENT',
            provider: 'Twilio',
            timestamp,
          });
        }
      } else {
        smsStatus = 'FAILED';
      }
    } catch (error) {
      console.error('SMS error:', error);
      smsStatus = 'FAILED';

      if (process.env.DATABASE_URL) {
        const { addNotificationLog } = await import('@/lib/productionDb');
        await addNotificationLog({
          id: `NOTIF-SMS-FAIL-${Date.now()}`,
          targetType: 'STUDENT_SMS',
          recipient: student.mobile,
          messageSnippet: `Failed to send SMS`,
          status: 'FAILED',
          provider: 'Twilio',
          timestamp,
          errorDetail: String(error),
        });
      }
    }
  } else {
    smsStatus = 'NOT_CONFIGURED';
  }

  return {
    emailStatus,
    smsStatus,
  };
}

/**
 * ============================================================
 * SEND DEMO RESCHEDULED NOTIFICATION
 * ============================================================
 */
export async function sendDemoRescheduleNotification(
  student: StudentRecord,
  booking: DemoBookingRecord,
  oldDate: string,
  oldTime: string
): Promise<{
  emailStatus: NotificationStatus;
  smsStatus: NotificationStatus;
}> {
  const timestamp = new Date().toISOString();
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@edupath.ai';
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const studentPhone = student.mobile.replace(/[^\d]/g, '');

  let emailStatus: NotificationStatus = 'DEV_MODE';
  let smsStatus: NotificationStatus = 'DEV_MODE';

  /* EMAIL */
  if (smtpHost && smtpUser && smtpPass && smtpPort) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const emailBody = `Dear ${student.name},

Your EduPath counselling session has been rescheduled.

📅 Previous Schedule:
Date: ${oldDate}
Time: ${oldTime}

🔄 New Schedule:
Date: ${booking.preferredDate}
Time: ${booking.preferredTimeSlot}
Mode: ${booking.counsellingMode || 'Online Video Call'}

Booking ID: ${booking.bookingId}
Counsellor: ${booking.counsellor || 'To be assigned'}

Please confirm your availability for the new time slot.

Best regards,
EduPath Team`;

      await transporter.sendMail({
        from: smtpFrom,
        to: student.email,
        subject: `EduPath Demo Rescheduled — ${booking.bookingId}`,
        text: emailBody,
      });

      emailStatus = 'SENT';

      if (process.env.DATABASE_URL) {
        const { addNotificationLog } = await import('@/lib/productionDb');
        await addNotificationLog({
          id: `NOTIF-EMAIL-RESCHEDULE-${Date.now()}`,
          targetType: 'STUDENT_EMAIL',
          recipient: student.email,
          messageSnippet: `Demo rescheduled from ${oldDate} to ${booking.preferredDate}`,
          status: 'SENT',
          provider: 'Nodemailer/SMTP',
          timestamp,
        });
      }
    } catch (error) {
      emailStatus = 'FAILED';
      console.error('Reschedule email error:', error);
    }
  }

  /* SMS */
  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const smsBody = `EduPath: Hi ${student.name}, your demo ${booking.bookingId} has been rescheduled to ${booking.preferredDate} at ${booking.preferredTimeSlot}.`;
      const response = await fetch(
        'https://api.twilio.com/2010-04-01/Accounts/' + twilioAccountSid + '/Messages.json',
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(twilioAccountSid + ':' + twilioAuthToken).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: twilioPhoneNumber, To: studentPhone, Body: smsBody }).toString(),
        }
      );

      if (response.ok) {
        smsStatus = 'SENT';
        if (process.env.DATABASE_URL) {
          const { addNotificationLog } = await import('@/lib/productionDb');
          await addNotificationLog({
            id: `NOTIF-SMS-RESCHEDULE-${Date.now()}`,
            targetType: 'STUDENT_SMS',
            recipient: student.mobile,
            messageSnippet: `Demo rescheduled`,
            status: 'SENT',
            provider: 'Twilio',
            timestamp,
          });
        }
      } else {
        smsStatus = 'FAILED';
      }
    } catch (error) {
      smsStatus = 'FAILED';
      console.error('Reschedule SMS error:', error);
    }
  }

  return { emailStatus, smsStatus };
}

/**
 * ============================================================
 * SEND DEMO CANCELLED NOTIFICATION
 * ============================================================
 */
export async function sendDemoCancellationNotification(
  student: StudentRecord,
  booking: DemoBookingRecord,
  reason: string
): Promise<{
  emailStatus: NotificationStatus;
  smsStatus: NotificationStatus;
}> {
  const timestamp = new Date().toISOString();
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@edupath.ai';
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const studentPhone = student.mobile.replace(/[^\d]/g, '');

  let emailStatus: NotificationStatus = 'DEV_MODE';
  let smsStatus: NotificationStatus = 'DEV_MODE';

  /* EMAIL */
  if (smtpHost && smtpUser && smtpPass && smtpPort) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const emailBody = `Dear ${student.name},

Your EduPath counselling session has been cancelled.

Booking ID: ${booking.bookingId}
Previous Date: ${booking.preferredDate}
Previous Time: ${booking.preferredTimeSlot}

Reason: ${reason}

If you would like to reschedule or have any questions, 
please contact EduPath support at support@edupath.ai.

Best regards,
EduPath Team`;

      await transporter.sendMail({
        from: smtpFrom,
        to: student.email,
        subject: `EduPath Demo Cancelled — ${booking.bookingId}`,
        text: emailBody,
      });

      emailStatus = 'SENT';

      if (process.env.DATABASE_URL) {
        const { addNotificationLog } = await import('@/lib/productionDb');
        await addNotificationLog({
          id: `NOTIF-EMAIL-CANCEL-${Date.now()}`,
          targetType: 'STUDENT_EMAIL',
          recipient: student.email,
          messageSnippet: `Demo ${booking.bookingId} cancelled`,
          status: 'SENT',
          provider: 'Nodemailer/SMTP',
          timestamp,
        });
      }
    } catch (error) {
      emailStatus = 'FAILED';
      console.error('Cancellation email error:', error);
    }
  }

  /* SMS */
  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const smsBody = `EduPath: Hi ${student.name}, your demo ${booking.bookingId} has been cancelled. Reason: ${reason}`;
      const response = await fetch(
        'https://api.twilio.com/2010-04-01/Accounts/' + twilioAccountSid + '/Messages.json',
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(twilioAccountSid + ':' + twilioAuthToken).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: twilioPhoneNumber, To: studentPhone, Body: smsBody }).toString(),
        }
      );

      if (response.ok) {
        smsStatus = 'SENT';
        if (process.env.DATABASE_URL) {
          const { addNotificationLog } = await import('@/lib/productionDb');
          await addNotificationLog({
            id: `NOTIF-SMS-CANCEL-${Date.now()}`,
            targetType: 'STUDENT_SMS',
            recipient: student.mobile,
            messageSnippet: `Demo cancelled`,
            status: 'SENT',
            provider: 'Twilio',
            timestamp,
          });
        }
      } else {
        smsStatus = 'FAILED';
      }
    } catch (error) {
      smsStatus = 'FAILED';
      console.error('Cancellation SMS error:', error);
    }
  }

  return { emailStatus, smsStatus };
}

/**
 * ============================================================
 * SEND DEMO COMPLETED NOTIFICATION
 * ============================================================
 */
export async function sendDemoCompletionNotification(
  student: StudentRecord,
  booking: DemoBookingRecord,
  outcome: string,
  followUpDate?: string
): Promise<{
  emailStatus: NotificationStatus;
  smsStatus: NotificationStatus;
}> {
  const timestamp = new Date().toISOString();
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@edupath.ai';
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const studentPhone = student.mobile.replace(/[^\d]/g, '');

  let emailStatus: NotificationStatus = 'DEV_MODE';
  let smsStatus: NotificationStatus = 'DEV_MODE';

  /* EMAIL */
  if (smtpHost && smtpUser && smtpPass && smtpPort) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const emailBody = `Dear ${student.name},

Thank you for attending your EduPath counselling session!

Session Details:
Booking ID: ${booking.bookingId}
Date: ${booking.preferredDate}
Time: ${booking.preferredTimeSlot}
Outcome: ${outcome}

${followUpDate ? `Follow-up scheduled for: ${followUpDate}` : ''}

We hope the session was helpful. For any further questions,
please visit your dashboard or contact us at support@edupath.ai.

Best regards,
EduPath Team
From 10th to Your First Job 🚀`;

      await transporter.sendMail({
        from: smtpFrom,
        to: student.email,
        subject: `EduPath Counselling Completed — ${booking.bookingId}`,
        text: emailBody,
      });

      emailStatus = 'SENT';

      if (process.env.DATABASE_URL) {
        const { addNotificationLog } = await import('@/lib/productionDb');
        await addNotificationLog({
          id: `NOTIF-EMAIL-COMPLETE-${Date.now()}`,
          targetType: 'STUDENT_EMAIL',
          recipient: student.email,
          messageSnippet: `Demo ${booking.bookingId} completed - ${outcome}`,
          status: 'SENT',
          provider: 'Nodemailer/SMTP',
          timestamp,
        });
      }
    } catch (error) {
      emailStatus = 'FAILED';
      console.error('Completion email error:', error);
    }
  }

  /* SMS */
  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const smsBody = `EduPath: Hi ${student.name}, your counselling session ${booking.bookingId} is now complete. Outcome: ${outcome}.`;
      const response = await fetch(
        'https://api.twilio.com/2010-04-01/Accounts/' + twilioAccountSid + '/Messages.json',
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(twilioAccountSid + ':' + twilioAuthToken).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: twilioPhoneNumber, To: studentPhone, Body: smsBody }).toString(),
        }
      );

      if (response.ok) {
        smsStatus = 'SENT';
        if (process.env.DATABASE_URL) {
          const { addNotificationLog } = await import('@/lib/productionDb');
          await addNotificationLog({
            id: `NOTIF-SMS-COMPLETE-${Date.now()}`,
            targetType: 'STUDENT_SMS',
            recipient: student.mobile,
            messageSnippet: `Demo completed`,
            status: 'SENT',
            provider: 'Twilio',
            timestamp,
          });
        }
      } else {
        smsStatus = 'FAILED';
      }
    } catch (error) {
      smsStatus = 'FAILED';
      console.error('Completion SMS error:', error);
    }
  }

  return { emailStatus, smsStatus };
}