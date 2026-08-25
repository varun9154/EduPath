export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';
import { NextRequest, NextResponse } from 'next/server';
import { ExcelStorageManager } from '@/lib/storage';
import { validateAdminRequest } from '@/lib/roleGuard';
import { getTimeSlots, updateTimeSlot as updateProductionTimeSlot, addCustomTimeSlot as addProductionTimeSlot } from '@/lib/productionDb';

export async function GET(request: NextRequest) {
  try {
    const auth = validateAdminRequest(request);
    if (!auth.authorized) return auth.response!;
    if (process.env.DATABASE_URL) return NextResponse.json({ success: true, slots: await getTimeSlots() });
    await prepareExcelStore();
    const store = new ExcelStorageManager();
    return NextResponse.json({ success: true, slots: store.getTimeSlots() });
  } catch (error) {
    console.error('Admin time-slots GET failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to load time slots.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = validateAdminRequest(request);
    if (!auth.authorized) return auth.response!;
    const body = await request.json();
    const action = String(body?.action || '').trim();

    if (process.env.DATABASE_URL) {
      if (action === 'toggle_slot') {
        const slotId = String(body?.slotId || '').trim();
        if (!slotId) return NextResponse.json({ success: false, message: 'slotId is required.' }, { status: 400 });
        const enabled = body?.enabled === true || body?.enabled === 'true';
        const current = (await getTimeSlots()).find((slot) => slot.id === slotId || slot.slotId === slotId);
        if (!current) return NextResponse.json({ success: false, message: 'Time slot not found.' }, { status: 404 });
        const blockedDates = Array.isArray(current.blockedDates) ? [...current.blockedDates] : [];
        if (body?.blockDate) {
          const date = String(body.blockDate);
          if (!blockedDates.includes(date)) blockedDates.push(date);
        }
        const updated = await updateProductionTimeSlot(slotId, { enabled, active: enabled, blockedDates });
        return NextResponse.json({ success: true, message: enabled ? 'Time slot enabled successfully.' : 'Time slot disabled successfully.', slot: updated });
      }

      if (action === 'add_slot' || action === 'add_time_slot') {
        const timeSlot = String(body?.timeSlot || '').trim();
        if (!timeSlot) return NextResponse.json({ success: false, message: 'timeSlot is required.' }, { status: 400 });
        const capacity = Math.max(1, Number(body?.capacity || 1));
        const created = await addProductionTimeSlot(timeSlot, capacity);
        return NextResponse.json({ success: true, message: 'New time slot added successfully.', slot: created });
      }

      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
    }

    await prepareExcelStore();
    const store = new ExcelStorageManager();
    if (action === 'toggle_slot') {
      const slotId = String(body?.slotId || '').trim();
      if (!slotId) return NextResponse.json({ success: false, message: 'slotId is required.' }, { status: 400 });
      const enabled = body?.enabled === true || body?.enabled === 'true';
      const updated = store.updateTimeSlot(slotId, enabled, body?.blockDate ? String(body.blockDate) : undefined);
      if (!updated) return NextResponse.json({ success: false, message: 'Time slot not found.' }, { status: 404 });
      await persistExcelStore();
      return NextResponse.json({ success: true, message: enabled ? 'Time slot enabled successfully.' : 'Time slot disabled successfully.', slot: updated });
    }
    if (action === 'add_slot' || action === 'add_time_slot') {
      const timeSlot = String(body?.timeSlot || '').trim();
      if (!timeSlot) return NextResponse.json({ success: false, message: 'timeSlot is required.' }, { status: 400 });
      const capacity = Math.max(1, Number(body?.capacity || 1));
      const created = store.addCustomTimeSlot(timeSlot, capacity);
      await persistExcelStore();
      return NextResponse.json({ success: true, message: 'New time slot added successfully.', slot: created });
    }
    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin time-slots POST failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to update time slots.' }, { status: 500 });
  }
}
