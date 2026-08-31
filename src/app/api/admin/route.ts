// src/app/api/admin/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/roleGuard';
import {
  getDashboardData,
  updateDemoBooking,
  addAuditLog,
} from '@/lib/productionDb';
import { leadStore } from '@/lib/storage';

function authorized(request: NextRequest) {
  return validateAdminRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const guard = authorized(request);
    if (!guard.authorized) return guard.response!;

    if (process.env.DATABASE_URL) {
      const dashboard = await getDashboardData();
      return NextResponse.json({ success: true, data: dashboard });
    }

    return NextResponse.json({ success: true, data: leadStore.getDashboardData() });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ success: false, message: 'Unable to load admin dashboard.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = authorized(request);
    if (!guard.authorized) return guard.response!;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || '');

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
