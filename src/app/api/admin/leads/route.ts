export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore, persistExcelStore } from '@/lib/excelPersistence';

import { NextRequest, NextResponse } from 'next/server';
import { leadStore } from '@/lib/storage';
import { validateAdminRequest } from '@/lib/roleGuard';

export async function GET(request: NextRequest) {
  try {
    const auth = validateAdminRequest(request);
    if (!auth.authorized) return auth.response!;
    await prepareExcelStore();
    const leads = leadStore.getLeads();
    const demoBookings = leadStore.getDemoBookings();
    const students = leadStore.getStudents();
    const counselling = leadStore.getCounsellingRecords();
    const notifications = leadStore.getNotificationLogs();
    const timeSlots = leadStore.getTimeSlots();
    return NextResponse.json({ success: true, data: { leads, demoBookings, students, counselling, notifications, timeSlots }, leads, demoBookings, students, counselling, notifications, timeSlots });
  } catch (error) {
    console.error('Admin leads GET failed:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unable to load admin data.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = validateAdminRequest(request);
    if (!auth.authorized) return auth.response!;
    await prepareExcelStore();
    const body = await request.json();
    const action = String(body?.action || '').trim();
    if (action === 'update_status') {
      const leadId = String(body?.leadId || '').trim();
      const status = String(body?.status || '').trim();
      if (!leadId || !status) return NextResponse.json({ success: false, message: 'leadId and status are required.' }, { status: 400 });
      const updated = leadStore.updateLeadStatus(leadId, status as never, body?.counsellor, body?.notes);
      if (!updated) return NextResponse.json({ success: false, message: 'Lead not found.' }, { status: 404 });
      await persistExcelStore();
      return NextResponse.json({ success: true, message: 'Lead updated successfully.', lead: updated });
    }
    return NextResponse.json({ success: false, message: 'Unknown admin lead action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin leads POST failed:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unable to update lead.' }, { status: 500 });
  }
}
