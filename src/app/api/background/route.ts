import { NextResponse } from 'next/server';
import { scheduleRecurringJob } from '@/lib/pg-queue';

export const dynamic = 'force-dynamic';

/**
 * Background Service Scheduler
 * Initializes recurring jobs for all worker tasks using PostgreSQL queue
 */
export async function GET() {
  try {
    // Schedule Entry Job - Processes pending position entries
    await scheduleRecurringJob(
      'entry-job',
      {},
      '*/30 * * * * *' // Every 30 seconds
    );

    // Schedule Valuation Job - Updates position valuations
    await scheduleRecurringJob(
      'valuation-job',
      {},
      '*/60 * * * * *' // Every 60 seconds
    );

    // Schedule Drift Monitor - Monitors delta drift
    await scheduleRecurringJob(
      'drift-monitor',
      {},
      '*/120 * * * * *' // Every 2 minutes
    );

    // Schedule Safety Check - Monitors max loss thresholds
    await scheduleRecurringJob(
      'safety-check',
      {},
      '*/60 * * * * *' // Every 60 seconds
    );

    // Schedule Keeper Monitor - Detects refund trigger payments
    await scheduleRecurringJob(
      'keeper-monitor',
      {},
      '*/30 * * * * *' // Every 30 seconds
    );

    return NextResponse.json({
      success: true,
      message: 'Background service initialized with PostgreSQL queue',
      jobs: [
        { name: 'entry-job', interval: '30s' },
        { name: 'valuation-job', interval: '60s' },
        { name: 'drift-monitor', interval: '120s' },
        { name: 'safety-check', interval: '60s' },
        { name: 'keeper-monitor', interval: '30s' },
      ],
    });
  } catch (error) {
    console.error('[Background Service] Failed to initialize:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
