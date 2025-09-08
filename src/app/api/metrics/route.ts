import { NextResponse } from 'next/server';
import { getMetricsSnapshot } from '@/lib/log';

export async function GET() {
  if (process.env.NODE_ENV !== 'development' && process.env.METRICS_PUBLIC !== '1') {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const snapshot = getMetricsSnapshot();
  return NextResponse.json({ ok: true, ...snapshot });
}

