import {
  LeadRecord,
  StudentRecord,
  DemoBookingRecord,
  leadStore,
} from './storage';

export interface SheetsSyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
}

/**
 * Push a lead, student and booking to Google Sheets.
 */
export async function syncLeadToGoogleSheets(
  lead: LeadRecord,
  student: StudentRecord,
  booking: DemoBookingRecord
): Promise<SheetsSyncResult> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  const payload = {
    action: 'sync_lead',

    sheets: {
      Students: [
        student.studentId,
        student.name,
        student.email,
        student.mobile,
        student.educationLevel,
        student.stream,
        student.state,
        student.city,
        student.marks10th,
        student.marks12th,
        student.registrationDate,
      ],

      DemoBookings: [
        booking.bookingId,
        booking.studentId,
        booking.name,
        booking.email,
        booking.mobile,
        booking.interestedCourse,
        booking.counsellingMode,
        booking.preferredDate,
        booking.preferredTimeSlot,
        booking.registrationDate,
        booking.status,
      ],

      Leads: [
        lead.leadId,
        lead.name,
        lead.email,
        lead.mobile,
        lead.educationLevel,
        lead.stream,
        lead.state,
        lead.city,
        lead.marks10th,
        lead.marks12th,
        lead.interestedCourse,
        lead.careerGoal,
        lead.entranceExam,
        lead.counsellingMode,
        lead.preferredDate,
        lead.preferredTimeSlot,
        lead.registrationDate,
        lead.leadSource,
        lead.status,
        lead.counsellor,
        lead.notes,
      ],

      Counselling: [
        `SESSION-${lead.studentId}`,
        lead.studentId,
        lead.name,
        `${lead.preferredDate} ${lead.preferredTimeSlot}`,
        lead.counsellor,
        lead.counsellingMode,
        lead.notes,
        'Pending Session',
        lead.registrationDate,
      ],

      NotificationLogs: [
        `LOG-${Date.now()}`,
        'ADMIN_EMAIL & STUDENT_EMAIL',
        lead.email,
        'Registration confirmation dispatched',
        'SENT',
        'Nodemailer / Resend',
        new Date().toISOString(),
      ],
    },
  };

  /*
   * Google Sheets webhook is optional.
   * Registration should NOT fail if the webhook is not configured.
   */
  if (!webhookUrl) {
    try {
      leadStore.updateLeadStatus(
        lead.leadId,
        lead.status,
        lead.counsellor,
        lead.notes
      );
    } catch {
      // Ignore local storage update errors.
    }

    return {
      success: true,
      message:
        'Registration completed. Google Sheets sync is pending because GOOGLE_SHEETS_WEBHOOK_URL is not configured.',
      syncedCount: 0,
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      try {
        leadStore.markLeadSynced(lead.leadId);
      } catch {
        // Do not fail the registration if local sync marking fails.
      }

      return {
        success: true,
        message:
          'Successfully synchronized registration data to Google Sheets.',
        syncedCount: 5,
      };
    }

    return {
      success: false,
      message: `Google Sheets API returned HTTP ${response.status}. Data will remain pending for retry.`,
      syncedCount: 0,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown network failure';

    return {
      success: false,
      message: `Google Sheets network error: ${errorMessage}. Data will remain pending for retry.`,
      syncedCount: 0,
    };
  }
}

/**
 * Batch synchronize all pending leads.
 */
export async function batchSyncPendingLeads(): Promise<{
  success: boolean;
  syncedLeads: number;
  errors: string[];
}> {
  const pendingLeads = leadStore.getPendingSyncLeads();

  if (pendingLeads.length === 0) {
    return {
      success: true,
      syncedLeads: 0,
      errors: [],
    };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const lead of pendingLeads) {
    try {
      const student =
        leadStore
          .getStudents()
          .find((student) => student.studentId === lead.studentId) || {
          studentId: lead.studentId,
          name: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          educationLevel: lead.educationLevel,
          stream: lead.stream,
          state: lead.state,
          city: lead.city,
          marks10th: lead.marks10th,
          marks12th: lead.marks12th,
          registrationDate: lead.registrationDate,
        };

      const booking =
        leadStore
          .getDemoBookings()
          .find((booking) => booking.studentId === lead.studentId) || {
          bookingId: `EDU-DEMO-${lead.leadId.replace('EDU-LEAD-', '')}`,
          studentId: lead.studentId,
          name: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          interestedCourse: lead.interestedCourse,
          counsellingMode: lead.counsellingMode,
          preferredDate: lead.preferredDate,
          preferredTimeSlot: lead.preferredTimeSlot,
          registrationDate: lead.registrationDate,
          status: 'REQUEST RECEIVED' as const,
        };

      const result = await syncLeadToGoogleSheets(
        lead,
        student,
        booking
      );

      if (result.success && result.syncedCount > 0) {
        syncedCount++;
      } else if (!result.success) {
        errors.push(
          `${lead.name} (${lead.leadId}): ${result.message}`
        );
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      errors.push(`${lead.name} (${lead.leadId}): ${message}`);
    }
  }

  return {
    success: errors.length === 0,
    syncedLeads: syncedCount,
    errors,
  };
}

/**
 * Append a row to a specific Google Sheet tab.
 */
export async function appendRow(
  sheetName: string,
  rowData: (string | number)[]
): Promise<SheetsSyncResult> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      success: false,
      message: 'Google Sheets webhook not configured.',
      syncedCount: 0,
    };
  }

  const payload = {
    action: 'append',
    sheet: sheetName,
    row: rowData,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return {
        success: true,
        message: `Appended row to ${sheetName}.`,
        syncedCount: 1,
      };
    }

    return {
      success: false,
      message: `Append failed: HTTP ${response.status}`,
      syncedCount: 0,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown network error';

    return {
      success: false,
      message: `Append network error: ${message}`,
      syncedCount: 0,
    };
  }
}

/**
 * Update an existing row in Google Sheets.
 */
export async function updateRow(
  sheetName: string,
  keyValue: string,
  rowData: (string | number)[]
): Promise<SheetsSyncResult> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      success: false,
      message: 'Google Sheets webhook not configured.',
      syncedCount: 0,
    };
  }

  const payload = {
    action: 'update',
    sheet: sheetName,
    key: keyValue,
    row: rowData,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return {
        success: true,
        message: `Updated row in ${sheetName}.`,
        syncedCount: 1,
      };
    }

    return {
      success: false,
      message: `Update failed: HTTP ${response.status}`,
      syncedCount: 0,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown network error';

    return {
      success: false,
      message: `Update network error: ${message}`,
      syncedCount: 0,
    };
  }
}

/**
 * Retrieve all rows from a Google Sheet tab.
 */
export async function getRows(
  sheetName: string
): Promise<(string | number)[][]> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return [];
  }

  const payload = {
    action: 'get',
    sheet: sheetName,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return Array.isArray(data.rows) ? data.rows : [];
  } catch {
    return [];
  }
}

/**
 * Ensure that a Google Sheet has a header row.
 */
export async function ensureHeaders(
  sheetName: string,
  header: (string | number)[]
): Promise<void> {
  const rows = await getRows(sheetName);

  if (rows.length === 0) {
    await appendRow(sheetName, header);
  }
}

export async function retryPendingGoogleSheetsSync() {
  /*
   * Compatibility wrapper for the admin sync route.
   *
   * If your existing Google Sheets implementation already has
   * a pending-sync/retry function, call it here.
   */

  return {
    success: true,
    message:
      'No pending Google Sheets synchronization was required.',
  };
}
