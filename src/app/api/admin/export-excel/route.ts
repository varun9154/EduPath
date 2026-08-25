export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prepareExcelStore } from '@/lib/excelPersistence';

import { NextResponse } from 'next/server';
import { generateEduPathExcelBuffer } from '@/lib/excelExport';
import { validateAdminRequest } from '@/lib/roleGuard';

export async function GET(req: Request) {
  try {
    if (!process.env.DATABASE_URL) await prepareExcelStore();
    // --------------------------------------------------
    // ADMIN AUTHORIZATION
    // --------------------------------------------------
    const auth = validateAdminRequest(req);

    if (!auth.authorized) {
      return auth.response!;
    }

    // --------------------------------------------------
    // GENERATE EXCEL FILE
    // --------------------------------------------------
    const result = await generateEduPathExcelBuffer();

    const { buffer, fileName } = result;

    // --------------------------------------------------
    // CONVERT BUFFER FOR NEXT.JS RESPONSE
    // --------------------------------------------------
    const uint8Array = new Uint8Array(buffer);

    // --------------------------------------------------
    // RETURN EXCEL DOWNLOAD
    // --------------------------------------------------
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

        'Content-Disposition':
          `attachment; filename="${fileName}"`,

        'Cache-Control':
          'no-store, max-age=0',

        'Content-Length':
          String(uint8Array.byteLength),
      },
    });
  } catch (error: unknown) {
    console.error(
      'Admin Excel export error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to generate Excel file';

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
