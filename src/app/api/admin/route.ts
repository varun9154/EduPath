// src/app/api/admin/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/roleGuard';
import {
  getDashboardData,
  updateDemoBooking,
  addAuditLog,
  getCounsellors,
  getCounsellorById,
  createCounsellor,
  getStudentById,
  getDemoBookings,
} from '@/lib/productionDb';
import { leadStore } from '@/lib/storage';
import {
  sendCounsellorAssignmentNotification,
  sendDemoRescheduleNotification,
  sendDemoCancellationNotification,
  sendDemoCompletionNotification,
} from '@/lib/notifications';

function authorized(request: NextRequest) {
  return validateAdminRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const guard = authorized(request);
    if (!guard.authorized) return guard.response!;

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');

    // Get counsellors list
    if (resource === 'counsellors') {
      if (process.env.DATABASE_URL) {
        const counsellors = await getCounsellors();
        return NextResponse.json({ success: true, data: counsellors });
      }
      return NextResponse.json({ success: true, data: [] });
    }

    // Get dashboard data (default)
    if (process.env.DATABASE_URL) {
      const dashboard = await getDashboardData();
      return NextResponse.json({ success: true, data: dashboard });
    }

    return NextResponse.json({ success: true, data: leadStore.getDashboardData() });
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ success: false, message: 'Unable to load admin data.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = authorized(request);
    if (!guard.authorized) return guard.response!;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || '');

    // ============================================================
    // COUNSELLOR MANAGEMENT
    // ============================================================

    if (action === 'create_counsellor') {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { success: false, message: 'Database not configured.' },
          { status: 503 }
        );
      }

      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const phone = String(body.phone || '').trim();
      const specialization = String(body.specialization || '').trim();

      if (!name || !email || !phone) {
        return NextResponse.json(
          {
            success: false,
            message: 'Name, email, and phone are required.',
          },
          { status: 400 }
        );
      }

      try {
        const counsellor = await createCounsellor({
          name,
          email,
          phone,
          specialization,
          active: true,
        });

        // Audit log
        await addAuditLog({
          id: `AUDIT-${Date.now()}`,
          action: 'COUNSELLOR_CREATED',
          actor: 'ADMIN',
          target: counsellor.counsellorId,
          details: `Created counsellor: ${name}`,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: 'Counsellor created successfully.',
          counsellor,
        });
      } catch (error) {
        console.error('Create counsellor error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to create counsellor.' },
          { status: 500 }
        );
      }
    }

    if (action === 'assign_counsellor') {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { success: false, message: 'Database not configured.' },
          { status: 503 }
        );
      }

      const bookingId = String(body.bookingId || '').trim();
      const counsellorId = String(body.counsellorId || '').trim();
      const counsellingDate = String(body.counsellingDate || '').trim();
      const counsellingTime = String(body.counsellingTime || '').trim();

      if (!bookingId || !counsellorId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Booking ID and Counsellor ID are required.',
          },
          { status: 400 }
        );
      }

      try {
        // Get the demo booking
        const demos = await getDemoBookings();
        const demo = demos.find((d) => d.bookingId === bookingId);
        if (!demo) {
          return NextResponse.json(
            { success: false, message: 'Demo booking not found.' },
            { status: 404 }
          );
        }

        // Get the counsellor
        const counsellor = await getCounsellorById(counsellorId);
        if (!counsellor) {
          return NextResponse.json(
            { success: false, message: 'Counsellor not found.' },
            { status: 404 }
          );
        }

        // IDEMPOTENCY CHECK: If already confirmed with same counsellor, return success without re-notifying
        if (demo.status === 'CONFIRMED' && demo.counsellor === counsellor.name) {
          return NextResponse.json({
            success: true,
            message: 'Counsellor assignment already processed (idempotent).',
            booking: demo,
          });
        }

        // Get student for notification
        const student = await getStudentById(demo.studentId);
        if (!student) {
          return NextResponse.json(
            { success: false, message: 'Student not found.' },
            { status: 404 }
          );
        }

        // Update demo booking
        const updates = {
          counsellor: counsellor.name,
          status: 'CONFIRMED' as const,
          ...(counsellingDate && { preferredDate: counsellingDate }),
          ...(counsellingTime && { preferredTimeSlot: counsellingTime }),
        };

        const updated = await updateDemoBooking(bookingId, updates);
        if (!updated) {
          return NextResponse.json(
            { success: false, message: 'Failed to update demo booking.' },
            { status: 500 }
          );
        }

        // Send notifications to student
        try {
          await sendCounsellorAssignmentNotification(student, updated, counsellor);
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
          // Don't fail the assignment if notification fails
        }

        // Audit log
        await addAuditLog({
          id: `AUDIT-${Date.now()}`,
          action: 'COUNSELLOR_ASSIGNED',
          actor: 'ADMIN',
          target: bookingId,
          details: `Assigned ${counsellor.name} to booking ${bookingId}`,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: 'Counsellor assigned and student notified.',
          booking: updated,
        });
      } catch (error) {
        console.error('Assign counsellor error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to assign counsellor.' },
          { status: 500 }
        );
      }
    }

    // ============================================================
    // DEMO BOOKING UPDATES
    // ============================================================

    if (action === 'reschedule_demo') {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { success: false, message: 'Database not configured.' },
          { status: 503 }
        );
      }

      const bookingId = String(body.bookingId || '').trim();
      const newDate = String(body.newDate || '').trim();
      const newTime = String(body.newTime || '').trim();

      if (!bookingId || !newDate || !newTime) {
        return NextResponse.json(
          {
            success: false,
            message: 'Booking ID, new date, and new time are required.',
          },
          { status: 400 }
        );
      }

      try {
        const demos = await getDemoBookings();
        const demo = demos.find((d) => d.bookingId === bookingId);
        if (!demo) {
          return NextResponse.json(
            { success: false, message: 'Demo booking not found.' },
            { status: 404 }
          );
        }

        const student = await getStudentById(demo.studentId);
        if (!student) {
          return NextResponse.json(
            { success: false, message: 'Student not found.' },
            { status: 404 }
          );
        }

        const updated = await updateDemoBooking(bookingId, {
          preferredDate: newDate,
          preferredTimeSlot: newTime,
          status: 'RESCHEDULED',
        });

        // Audit log
        await addAuditLog({
          id: `AUDIT-${Date.now()}`,
          action: 'DEMO_RESCHEDULED',
          actor: 'ADMIN',
          target: bookingId,
          details: `Rescheduled to ${newDate} at ${newTime}`,
          timestamp: new Date().toISOString(),
        });

        // Send reschedule notification to student
        try {
          if (updated) {
            await sendDemoRescheduleNotification(student, updated, demo.preferredDate, demo.preferredTimeSlot);
          }
        } catch (notifyError) {
          console.error('Reschedule notification error:', notifyError);
        }

        return NextResponse.json({
          success: true,
          message: 'Demo rescheduled successfully.',
          booking: updated,
        });
      } catch (error) {
        console.error('Reschedule error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to reschedule demo.' },
          { status: 500 }
        );
      }
    }

    if (action === 'cancel_demo') {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { success: false, message: 'Database not configured.' },
          { status: 503 }
        );
      }

      const bookingId = String(body.bookingId || '').trim();
      const reason = String(body.reason || 'No reason provided').trim();

      if (!bookingId) {
        return NextResponse.json(
          { success: false, message: 'Booking ID is required.' },
          { status: 400 }
        );
      }

      try {
        const demos = await getDemoBookings();
        const demo = demos.find((d) => d.bookingId === bookingId);
        if (!demo) {
          return NextResponse.json(
            { success: false, message: 'Demo booking not found.' },
            { status: 404 }
          );
        }

        const student = await getStudentById(demo.studentId);
        if (!student) {
          return NextResponse.json(
            { success: false, message: 'Student not found.' },
            { status: 404 }
          );
        }

        const updated = await updateDemoBooking(bookingId, {
          status: 'CANCELLED',
          notes: reason,
        });

        // Audit log
        await addAuditLog({
          id: `AUDIT-${Date.now()}`,
          action: 'DEMO_CANCELLED',
          actor: 'ADMIN',
          target: bookingId,
          details: `Cancelled: ${reason}`,
          timestamp: new Date().toISOString(),
        });

        // Send cancellation notification to student
        try {
          if (updated) {
            await sendDemoCancellationNotification(student, updated, reason);
          }
        } catch (notifyError) {
          console.error('Cancellation notification error:', notifyError);
        }

        return NextResponse.json({
          success: true,
          message: 'Demo cancelled successfully.',
          booking: updated,
        });
      } catch (error) {
        console.error('Cancel error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to cancel demo.' },
          { status: 500 }
        );
      }
    }

    if (action === 'complete_demo') {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { success: false, message: 'Database not configured.' },
          { status: 503 }
        );
      }

      const bookingId = String(body.bookingId || '').trim();
      const outcome = String(body.outcome || '').trim();
      const notes = String(body.notes || '').trim();
      const followUpDate = String(body.followUpDate || '').trim();

      if (!bookingId) {
        return NextResponse.json(
          { success: false, message: 'Booking ID is required.' },
          { status: 400 }
        );
      }

      try {
        const demos = await getDemoBookings();
        const demo = demos.find((d) => d.bookingId === bookingId);
        if (!demo) {
          return NextResponse.json(
            { success: false, message: 'Demo booking not found.' },
            { status: 404 }
          );
        }

        const student = await getStudentById(demo.studentId);
        if (!student) {
          return NextResponse.json(
            { success: false, message: 'Student not found.' },
            { status: 404 }
          );
        }

        const updateData: any = {
          status: 'COMPLETED',
        };

        if (notes) updateData.notes = notes;
        if (outcome) updateData.outcome = outcome;

        const updated = await updateDemoBooking(bookingId, updateData);

        // Audit log
        await addAuditLog({
          id: `AUDIT-${Date.now()}`,
          action: 'DEMO_COMPLETED',
          actor: 'ADMIN',
          target: bookingId,
          details: `Outcome: ${outcome || 'N/A'}, Notes: ${notes}`,
          timestamp: new Date().toISOString(),
        });

        // Send completion notification to student
        try {
          if (updated) {
            await sendDemoCompletionNotification(student, updated, outcome || 'Completed', followUpDate);
          }
        } catch (notifyError) {
          console.error('Completion notification error:', notifyError);
        }

        return NextResponse.json({
          success: true,
          message: 'Demo marked as completed.',
          booking: updated,
        });
      } catch (error) {
        console.error('Complete error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to complete demo.' },
          { status: 500 }
        );
      }
    }

    if (action === 'update_demo_booking') {
      const bookingId = String(body.bookingId || '');
      if (!bookingId) return NextResponse.json({ success: false, message: 'Booking ID is required.' }, { status: 400 });
      const updates = {
        ...(body.status ? { status: String(body.status) } : {}),
        ...(body.counsellor !== undefined ? { counsellor: String(body.counsellor) } : {}),
        ...(body.notes !== undefined ? { notes: String(body.notes) } : {}),
      } as Parameters<typeof updateDemoBooking>[1];

      const updated = process.env.DATABASE_URL
        ? await updateDemoBooking(bookingId, updates)
        : leadStore.updateDemoBooking(bookingId, updates);
      if (!updated) return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });

      const audit = {
        id: `AUDIT-${Date.now()}`,
        action: 'DEMO_BOOKING_UPDATED',
        actor: 'ADMIN',
        target: bookingId,
        details: `Status: ${String(body.status || 'UNCHANGED')}`,
        timestamp: new Date().toISOString(),
      };
      if (process.env.DATABASE_URL) await addAuditLog(audit);
      else leadStore.addAuditLog(audit);

      return NextResponse.json({ success: true, message: 'Demo booking updated successfully.', booking: updated });
    }

    if (action === 'audit') {
      const audit = {
        id: `AUDIT-${Date.now()}`,
        action: String(body.auditAction || 'ADMIN_ACTION'),
        actor: 'ADMIN',
        target: String(body.target || ''),
        details: String(body.details || ''),
        timestamp: new Date().toISOString(),
      };
      if (process.env.DATABASE_URL) await addAuditLog(audit);
      else leadStore.addAuditLog(audit);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Unknown admin action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ success: false, message: 'Admin operation failed.' }, { status: 500 });
  }
}
