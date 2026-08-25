import { NextResponse } from 'next/server';
import { answerCounsellor } from '@/lib/aiCounsellor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || 'unknown';
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const existing = requestBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) return true;
  existing.count += 1;
  return false;
}

export async function POST(req: Request) {
  try {
    if (rateLimited(clientKey(req))) {
      return NextResponse.json(
        { success: false, message: 'Too many AI requests. Please wait a minute and try again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await req.json() as { query?: unknown; history?: unknown };
    const result = await answerCounsellor(body.query, body.history);

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI Counsellor processing failed';
    const status = /required|too long/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
