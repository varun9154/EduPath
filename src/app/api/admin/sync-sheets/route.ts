export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore } from '@/lib/excelPersistence';

import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/roleGuard';
import { leadStore } from '@/lib/storage';

/**
 * Excel-primary synchronization endpoint.
 *
 * EduPath no longer treats Google Sheets as the system of record.
 * The application's Excel workbook is the primary operational store.
 *
 * This endpoint is intentionally retained so existing admin UI/API
 * links do not break after production deployment.
 */
export async function GET(req: Request) {
  try {
    await prepareExcelStore();
    const auth = validateAdminRequest(req);

    if (!auth.authorized) {
      return auth.response!;
    }

    const pending = leadStore.getPendingSyncLeads();

    return NextResponse.json({
      success: true,
      message: 'Excel is the primary EduPath data store. No Google Sheets synchronization is required.',
      result: {
        pendingCount: pending.length,
        pendingLeadIds: pending.map((lead) => lead.leadId),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to inspect Excel synchronization state.';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
