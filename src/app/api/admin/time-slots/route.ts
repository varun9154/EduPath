// src/app/api/admin/time-slots/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/roleGuard';
import { getTimeSlots, updateTimeSlot, addCustomTimeSlot } from '@/lib/productionDb';
import { leadStore } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const guard = validateAdminRequest(request);
    if (!guard.authorized) return guard.response!;
    const slots = process.env.DATABASE_URL ? await getTimeSlots() : leadStore.getTimeSlots();
    return NextResponse.json({ success: true, slots, data: slots });
  } catch (error) {
    console.error('Admin time-slots GET failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to load time slots.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = validateAdminRequest(request);
    if (!guard.authorized) return guard.response!;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || '').trim();

    if (action === 'toggle_slot') {
      const slotId = String(body.slotId || '').trim();
      if (!slotId) return NextResponse.json({ success: false, message: 'slotId is required.' }, { status: 400 });
      const enabled = body.enabled === true || body.enabled === 'true';
      const blockDate = body.blockDate ? String(body.blockDate) : '';
      const slot = process.env.DATABASE_URL
        ? await updateTimeSlot(slotId, { enabled, ...(blockDate ? { blockedDates: [blockDate] } : {}) })
        : leadStore.updateTimeSlot(slotId, enabled, blockDate);
      if (!slot) return NextResponse.json({ success: false, message: 'Time slot not found.' }, { status: 404 });
      return NextResponse.json({ success: true, message: enabled ? 'Time slot enabled successfully.' : 'Time slot disabled successfully.', slot });
    }

    if (action === 'add_slot' || action === 'add_time_slot') {
      const timeSlot = String(body.timeSlot || '').trim();
      if (!timeSlot) return NextResponse.json({ success: false, message: 'timeSlot is required.' }, { status: 400 });
      const capacity = Number(body.capacity ?? 1);
      const slot = process.env.DATABASE_URL
        ? await addCustomTimeSlot(timeSlot, Number.isFinite(capacity) && capacity > 0 ? capacity : 1)
        : leadStore.addCustomTimeSlot(timeSlot);
      return NextResponse.json({ success: true, message: 'New time slot added successfully.', slot });
    }

    return NextResponse.json({ success: false, message: 'Invalid action. Use "toggle_slot" or "add_slot".' }, { status: 400 });
  } catch (error) {
    console.error('Admin time-slots POST failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to process time slot request.' }, { status: 500 });
  }
}
