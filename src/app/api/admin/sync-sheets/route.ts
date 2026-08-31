import { NextResponse } from 'next/server';

import {
  retryPendingGoogleSheetsSync,
} from '@/lib/googleSheets';

import {
  validateAdminRequest,
} from '@/lib/roleGuard';

export const runtime = 'nodejs';

export async function GET(
  req: Request
) {
  try {
    // --------------------------------------------------
    // ADMIN AUTHORIZATION
    // --------------------------------------------------

    const auth =
      validateAdminRequest(req);

    if (!auth.authorized) {
      return auth.response!;
    }

    // --------------------------------------------------
    // RETRY PENDING GOOGLE SHEETS SYNCHRONIZATION
    // --------------------------------------------------

    const result =
      await retryPendingGoogleSheetsSync();

    return NextResponse.json({
      success: true,
      message:
        'Pending Google Sheets synchronization completed.',
      result,
    });
  } catch (error: unknown) {
    console.error(
      'Google Sheets sync error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to synchronize Google Sheets.';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}