// src/app/api/admin/leads/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getDashboardData, getCounsellingRecords, updateLeadStatus as updateProductionLeadStatus } from '@/lib/productionDb';
import { validateAdminRequest } from '@/lib/roleGuard';
import { leadStore, type LeadRecord } from '@/lib/storage';

const VALID_STATUSES: LeadRecord['status'][] = [
  'NEW','CONTACTED','REQUESTED','SCHEDULED','CONFIRMED','COMPLETED','RESCHEDULED','CANCELLED','NO SHOW','FOLLOW UP'
];

export async function GET(request: Request) {
  try {
    const guard = validateAdminRequest(request);
    if (!guard.authorized) return guard.response!;

    if (process.env.DATABASE_URL) {
      const dashboard = await getDashboardData();
      const { students, demoBookings, leads, notifications, timeSlots } = dashboard;
      const counselling = await getCounsellingRecords();
      const today = new Date().toISOString().slice(0, 10);
      const newLeads = leads.filter((lead) => lead.status === 'NEW').length;
      const followUps = leads.filter((lead) => lead.status === 'FOLLOW UP' || lead.status === 'CONTACTED').length;
      const todaysDemos = demoBookings.filter((booking) => String(booking.preferredDate || booking.registrationDate || '').slice(0, 10) === today).length;
      const pendingConfirmations = demoBookings.filter((booking) => booking.status === 'REQUEST RECEIVED').length;
      const pendingSyncCount = leads.filter((lead) => lead.sheetsSyncStatus === 'PENDING_SYNC' || lead.sheetsSyncStatus === 'FAILED').length;

      return NextResponse.json({
        success: true,
        message: 'Admin dashboard data loaded successfully',
        dataSource: 'NEON_POSTGRESQL',
        metrics: {
          totalStudents: students.length,
          newLeads,
          demoRequests: demoBookings.length,
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
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin dashboard data loaded successfully',
      dataSource: 'LOCAL_STORE',
      metrics: {
        totalStudents: leadStore.getStudents().length,
        newLeads: leadStore.getLeads().filter((lead) => lead.status === 'NEW').length,
        demoRequests: leadStore.getDemoBookings().length,
        todaysDemos: leadStore.getDemoBookings().filter((booking) => String(booking.preferredDate || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
        pendingConfirmations: leadStore.getDemoBookings().filter((booking) => booking.status === 'REQUEST RECEIVED').length,
        followUps: leadStore.getLeads().filter((lead) => lead.status === 'FOLLOW UP' || lead.status === 'CONTACTED').length,
        pendingSyncCount: leadStore.getPendingSyncLeads().length,
      },
      leads: leadStore.getLeads(),
      demoBookings: leadStore.getDemoBookings(),
      students: leadStore.getStudents(),
      counselling: leadStore.getCounsellingRecords(),
      notifications: leadStore.getNotificationLogs(),
      timeSlots: leadStore.getTimeSlots(),
    });
  } catch (error) {
    console.error('[ADMIN API GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Admin dashboard failed to load' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = validateAdminRequest(request);
    if (!guard.authorized) return guard.response!;
    const body = (await request.json()) as Record<string, unknown>;
    if (String(body.action || '') !== 'update_status') {
      return NextResponse.json({ success: false, message: 'Invalid admin action' }, { status: 400 });
    }
    const leadId = String(body.leadId || '');
    const status = String(body.status || '') as LeadRecord['status'];
    if (!leadId || !status) return NextResponse.json({ success: false, message: 'leadId and status are required' }, { status: 400 });
    if (!VALID_STATUSES.includes(status)) return NextResponse.json({ success: false, message: `Invalid lead status: ${status}` }, { status: 400 });

    const counsellor = body.counsellor !== undefined ? String(body.counsellor) : undefined;
    const notes = body.notes !== undefined ? String(body.notes) : undefined;
    const updated = process.env.DATABASE_URL
      ? await updateProductionLeadStatus(leadId, status, counsellor, notes)
      : leadStore.updateLeadStatus(leadId, status, counsellor, notes);

    if (!updated) return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Lead status updated successfully', lead: updated });
  } catch (error) {
    console.error('[ADMIN API POST ERROR]', error);
    return NextResponse.json({ success: false, message: 'Admin request failed' }, { status: 500 });
  }
}
