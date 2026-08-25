import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';
// src/app/api/admin/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { leadStore } from '@/lib/storage';
import { authManager } from '@/lib/auth';
import { getDashboardData as getProductionDashboardData, updateDemoBooking as updateProductionDemoBooking, addAuditLog as addProductionAuditLog } from '@/lib/productionDb';

function isAdminAuthenticated(
  request: NextRequest
) {
  const sessionId =
    request.cookies.get(
      'edupath_admin_sess'
    )?.value;

  if (!sessionId) {
    return false;
  }

  return authManager.validateAdminSession(
    sessionId
  );
}

// ============================================================
// GET /api/admin
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    if (
      !isAdminAuthenticated(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized admin access.',
        },
        {
          status: 401,
        }
      );
    }

    const dashboard = process.env.DATABASE_URL
      ? await getProductionDashboardData()
      : (await prepareExcelStore(), leadStore.getDashboardData());

    return NextResponse.json({
      success: true,

      data: dashboard,
    });

  } catch (error) {

    console.error(
      'Admin dashboard error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load admin dashboard.',
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin
//
// Admin actions
// ============================================================

export async function POST(
  request: NextRequest
) {

  try {
    if (
      !isAdminAuthenticated(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized admin access.',
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const action =
      body.action;

    // --------------------------------------------------------
    // UPDATE DEMO BOOKING
    // --------------------------------------------------------

    if (
      action ===
      'update_demo_booking'
    ) {

      const bookingId =
        body.bookingId;

      if (!bookingId) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Booking ID is required.',
          },
          {
            status: 400,
          }
        );
      }

      const updates = {
        ...(body.status ? { status: body.status } : {}),
        ...(body.counsellor !== undefined ? { counsellor: body.counsellor } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      };

      const updated = process.env.DATABASE_URL
        ? await updateProductionDemoBooking(bookingId, updates)
        : (await prepareExcelStore(), leadStore.updateDemoBooking(bookingId, updates));

      if (!updated) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Booking not found.',
          },
          {
            status: 404,
          }
        );
      }

      const audit = {
        id: `AUDIT-${Date.now()}`,

        action:
          'DEMO_BOOKING_UPDATED',

        actor:
          'ADMIN',

        target:
          bookingId,

        details:
          `Status: ${
            body.status ||
            'UNCHANGED'
          }`,

        timestamp:
          new Date().toISOString(),
      };
      if (process.env.DATABASE_URL) await addProductionAuditLog(audit);
      else { leadStore.addAuditLog(audit); await persistExcelStore(); }

      return NextResponse.json({ success: true, message: 'Demo booking updated successfully.', booking: updated });
    }

    // --------------------------------------------------------
    // ADD ADMIN NOTE
    // --------------------------------------------------------

    if (
      action === 'audit'
    ) {

      const audit = {
        id: `AUDIT-${Date.now()}`,

        action:
          body.auditAction ||
          'ADMIN_ACTION',

        actor:
          'ADMIN',

        target:
          body.target || '',

        details:
          body.details || '',

        timestamp:
          new Date().toISOString(),
      };
      if (process.env.DATABASE_URL) await addProductionAuditLog(audit);
      else { leadStore.addAuditLog(audit); await persistExcelStore(); }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Unknown admin action.',
      },
      {
        status: 400,
      }
    );

  } catch (error) {

    console.error(
      'Admin API error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Admin operation failed.',
      },
      {
        status: 500,
      }
    );
  }
}
