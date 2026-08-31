// src/app/api/admin/leads/route.ts

import { NextResponse } from 'next/server';

import {
  leadStore,
  LeadRecord,
  DemoBookingRecord,
  StudentRecord,
  CounsellingRecord,
  NotificationLogRecord,
  TimeSlotConfig,
} from '@/lib/storage';

import { validateAdminRequest } from '@/lib/roleGuard';
import { getRows } from '@/lib/googleSheets';

/**
 * ============================================================
 * EDUPath ADMIN LEADS API
 * ============================================================
 *
 * GET
 * - Validates admin session
 * - Reads Google Sheets
 * - Falls back to local leadStore if Sheets is unavailable
 * - Returns dashboard metrics
 *
 * POST
 * - Updates lead status
 *
 * The API supports BOTH:
 *
 * 1. Google Sheets rows -> arrays
 * 2. Local leadStore    -> objects
 *
 * ============================================================
 */

/**
 * ------------------------------------------------------------
 * SAFE GOOGLE SHEET READER
 * ------------------------------------------------------------
 *
 * A missing/broken sheet should not crash the Admin Dashboard.
 */
async function safeGetRows(
  sheetName: string
): Promise<unknown[]> {
  try {
    const rows = await getRows(sheetName);

    if (!Array.isArray(rows)) {
      console.warn(
        `[ADMIN] ${sheetName} did not return an array`
      );

      return [];
    }

    return rows;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown Google Sheets error';

    console.error(
      `[ADMIN] Failed to read ${sheetName}:`,
      message
    );

    return [];
  }
}

/**
 * ------------------------------------------------------------
 * GET ALL VALUES FROM A ROW / RECORD
 * ------------------------------------------------------------
 *
 * Google Sheets:
 *
 * [
 *   "EDU-001",
 *   "Varun",
 *   "9876543210",
 *   "NEW"
 * ]
 *
 * Local Store:
 *
 * {
 *   leadId: "EDU-001",
 *   name: "Varun",
 *   status: "NEW"
 * }
 *
 * This function supports BOTH.
 */
function getValues(item: unknown): unknown[] {
  if (Array.isArray(item)) {
    return item;
  }

  if (
    item !== null &&
    typeof item === 'object'
  ) {
    return Object.values(
      item as Record<string, unknown>
    );
  }

  return [item];
}

/**
 * ------------------------------------------------------------
 * CHECK WHETHER ROW/RECORD CONTAINS A VALUE
 * ------------------------------------------------------------
 */
function containsValue(
  item: unknown,
  expected: string
): boolean {
  const values = getValues(item);

  return values.some((value) => {
    return (
      String(value ?? '')
        .trim()
        .toUpperCase() ===
      expected.trim().toUpperCase()
    );
  });
}

/**
 * ------------------------------------------------------------
 * CHECK DATE
 * ------------------------------------------------------------
 */
function containsDate(
  item: unknown,
  expectedDate: string
): boolean {
  const values = getValues(item);

  return values.some((value) => {
    const text = String(value ?? '').trim();

    return (
      text === expectedDate ||
      text.startsWith(`${expectedDate} `) ||
      text.startsWith(`${expectedDate}T`)
    );
  });
}

/**
 * ============================================================
 * GET
 * ============================================================
 */
export async function GET(req: Request) {
  try {
    /**
     * --------------------------------------------------------
     * ADMIN SESSION CHECK
     * --------------------------------------------------------
     */
    const auth = validateAdminRequest(req);

    if (!auth.authorized) {
      return (
        auth.response ??
        NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
          },
          {
            status: 401,
          }
        )
      );
    }

    console.log(
      '[ADMIN API] Admin session validated'
    );

    /**
     * --------------------------------------------------------
     * READ GOOGLE SHEETS
     * --------------------------------------------------------
     *
     * Each sheet is protected independently.
     *
     * If one sheet fails, the dashboard continues working.
     */
    const [
      leadRows,
      demoRows,
      studentRows,
      counsellingRows,
      notificationRows,
      timeSlotRows,
    ] = await Promise.all([
      safeGetRows('Leads'),
      safeGetRows('DemoBookings'),
      safeGetRows('Students'),
      safeGetRows('Counselling'),
      safeGetRows('NotificationLogs'),
      safeGetRows('TimeSlots'),
    ]);

    /**
     * --------------------------------------------------------
     * LOCAL STORE DATA
     * --------------------------------------------------------
     */
    const localLeads: LeadRecord[] =
      leadStore.getLeads();

    const localDemoBookings: DemoBookingRecord[] =
      leadStore.getDemoBookings();

    const localStudents: StudentRecord[] =
      leadStore.getStudents();

    const localCounselling: CounsellingRecord[] =
      leadStore.getCounsellingRecords();

    const localNotifications: NotificationLogRecord[] =
      leadStore.getNotificationLogs();

    const localTimeSlots: TimeSlotConfig[] =
      leadStore.getTimeSlots();

    /**
     * --------------------------------------------------------
     * CHOOSE DATA SOURCE
     * --------------------------------------------------------
     *
     * Google Sheets data is preferred when available.
     *
     * Otherwise local store is used.
     */
    const leads: unknown[] =
      leadRows.length > 0
        ? leadRows
        : localLeads;

    const demoBookings: unknown[] =
      demoRows.length > 0
        ? demoRows
        : localDemoBookings;

    const students: unknown[] =
      studentRows.length > 0
        ? studentRows
        : localStudents;

    const counselling: unknown[] =
      counsellingRows.length > 0
        ? counsellingRows
        : localCounselling;

    const notifications: unknown[] =
      notificationRows.length > 0
        ? notificationRows
        : localNotifications;

    const timeSlots: unknown[] =
      timeSlotRows.length > 0
        ? timeSlotRows
        : localTimeSlots;

    /**
     * --------------------------------------------------------
     * DATA SOURCE
     * --------------------------------------------------------
     */
    const usingGoogleSheets =
      leadRows.length > 0 ||
      demoRows.length > 0 ||
      studentRows.length > 0 ||
      counsellingRows.length > 0 ||
      notificationRows.length > 0 ||
      timeSlotRows.length > 0;

    const dataSource = usingGoogleSheets
      ? 'GOOGLE_SHEETS'
      : 'LOCAL_STORE';

    /**
     * --------------------------------------------------------
     * METRICS
     * --------------------------------------------------------
     */

    const totalStudents =
      students.length;

    /**
     * NEW LEADS
     */
    const newLeads =
      leads.filter((row) =>
        containsValue(row, 'NEW')
      ).length;

    /**
     * TOTAL DEMO REQUESTS
     */
    const demoRequests =
      demoBookings.length;

    /**
     * TODAY
     */
    const todayStr =
      new Date()
        .toISOString()
        .split('T')[0];

    /**
     * TODAY'S DEMOS
     */
    const todaysDemos =
      demoBookings.filter((row) =>
        containsDate(row, todayStr)
      ).length;

    /**
     * PENDING CONFIRMATIONS
     */
    const pendingConfirmations =
      demoBookings.filter((row) =>
        containsValue(
          row,
          'REQUEST RECEIVED'
        )
      ).length;

    /**
     * FOLLOW UPS
     *
     * CONTACTED + FOLLOW UP
     */
    const followUps =
      leads.filter((row) => {
        return (
          containsValue(
            row,
            'FOLLOW UP'
          ) ||
          containsValue(
            row,
            'CONTACTED'
          )
        );
      }).length;

    /**
     * PENDING SHEETS SYNC
     */
    const pendingSyncCount =
      leadStore
        .getPendingSyncLeads()
        .length;

    /**
     * --------------------------------------------------------
     * LOG INFORMATION
     * --------------------------------------------------------
     */
    console.log(
      '[ADMIN API] Dashboard loaded',
      {
        dataSource,
        totalStudents,
        newLeads,
        demoRequests,
        todaysDemos,
        pendingConfirmations,
        followUps,
        pendingSyncCount,
      }
    );

    /**
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */
    return NextResponse.json(
      {
        success: true,

        message:
          'Admin dashboard data loaded successfully',

        dataSource,

        metrics: {
          totalStudents,
          newLeads,
          demoRequests,
          todaysDemos,
          pendingConfirmations,
          followUps,
          pendingSyncCount,
        },

        leads,

        demoBookings,

        students,

        counselling,

        notifications,

        timeSlots,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    /**
     * --------------------------------------------------------
     * FINAL ERROR HANDLER
     * --------------------------------------------------------
     */

    console.error(
      '[ADMIN API GET ERROR]',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Internal Server Error';

    return NextResponse.json(
      {
        success: false,

        message:
          'Admin dashboard failed to load',

        error:
          process.env.NODE_ENV ===
          'development'
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ============================================================
 * POST
 * ============================================================
 *
 * Used by Admin Dashboard to update lead status.
 *
 * ============================================================
 */
export async function POST(req: Request) {
  try {
    /**
     * --------------------------------------------------------
     * ADMIN SESSION
     * --------------------------------------------------------
     */
    const auth =
      validateAdminRequest(req);

    if (!auth.authorized) {
      return (
        auth.response ??
        NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
          },
          {
            status: 401,
          }
        )
      );
    }

    /**
     * --------------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------------
     */
    const body = await req.json();

    const {
      action,
      leadId,
      status,
      counsellor,
      notes,
    } = body;

    /**
     * --------------------------------------------------------
     * UPDATE STATUS
     * --------------------------------------------------------
     */
    if (
      action === 'update_status'
    ) {
      if (!leadId) {
        return NextResponse.json(
          {
            success: false,
            message:
              'leadId is required',
          },
          {
            status: 400,
          }
        );
      }

      if (!status) {
        return NextResponse.json(
          {
            success: false,
            message:
              'status is required',
          },
          {
            status: 400,
          }
        );
      }

      /**
       * Valid LeadRecord statuses
       */
      const validStatuses: LeadRecord['status'][] =
        [
          'NEW',
          'CONTACTED',
          'REQUESTED',
          'SCHEDULED',
          'CONFIRMED',
          'COMPLETED',
          'RESCHEDULED',
          'CANCELLED',
          'NO SHOW',
          'FOLLOW UP',
        ];

      if (
        !validStatuses.includes(
          status as LeadRecord['status']
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Invalid lead status: ${status}`,
          },
          {
            status: 400,
          }
        );
      }

      /**
       * ------------------------------------------------------
       * UPDATE LOCAL STORE
       * ------------------------------------------------------
       */
      const updatedLead =
        leadStore.updateLeadStatus(
          String(leadId),
          status as LeadRecord['status'],
          counsellor !== undefined
            ? String(counsellor)
            : undefined,
          notes !== undefined
            ? String(notes)
            : undefined
        );

      if (!updatedLead) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Lead not found',
          },
          {
            status: 404,
          }
        );
      }

      /**
       * ------------------------------------------------------
       * SUCCESS
       * ------------------------------------------------------
       */
      return NextResponse.json(
        {
          success: true,

          message:
            'Lead status updated successfully',

          lead: updatedLead,
        },
        {
          status: 200,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * INVALID ACTION
     * --------------------------------------------------------
     */
    return NextResponse.json(
      {
        success: false,
        message:
          'Invalid admin action',
      },
      {
        status: 400,
      }
    );
  } catch (error: unknown) {
    console.error(
      '[ADMIN API POST ERROR]',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Internal Server Error';

    return NextResponse.json(
      {
        success: false,

        message:
          'Admin request failed',

        error:
          process.env.NODE_ENV ===
          'development'
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}