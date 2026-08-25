export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore } from '@/lib/excelPersistence';
import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/roleGuard';
import { leadStore } from '@/lib/storage';
import { getPendingSyncLeads } from '@/lib/productionDb';

export async function GET(req: Request) {
  try {
    const auth = validateAdminRequest(req);
    if (!auth.authorized) return auth.response!;
    const pending = process.env.DATABASE_URL ? await getPendingSyncLeads() : (await prepareExcelStore(), leadStore.getPendingSyncLeads());
    return NextResponse.json({
      success: true,
      message: process.env.DATABASE_URL
        ? 'Pending lead synchronization state loaded from the production database.'
        : 'Excel synchronization state loaded from local development storage.',
      result: { pendingCount: pending.length, pendingLeadIds: pending.map((lead) => lead.leadId) },
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: 'Unable to inspect synchronization state.' }, { status: 500 });
  }
}
