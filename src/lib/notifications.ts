import {
  LeadRecord,
  StudentRecord,
  DemoBookingRecord,
  leadStore,
} from './storage';
import { appendRow } from '@/lib/googleSheets';

type NotificationStatus =
  | 'SENT'
  | 'PENDING'
  | 'FAILED'
  | 'DEV_MODE';

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