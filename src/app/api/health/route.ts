export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { ensureProductionSchema, productionDatabaseStatus } from '@/lib/productionDb';

export async function GET() {
  const started = Date.now();

  try {
    if (process.env.DATABASE_URL) {
      await ensureProductionSchema();
    }

    return NextResponse.json({
      success: true,
      status: 'OK',
      service: 'EduPath',
      database: productionDatabaseStatus(),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'DEGRADED',
        service: 'EduPath',
        database: productionDatabaseStatus(),
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - started,
      },
      { status: 503 }
    );
  }
}
