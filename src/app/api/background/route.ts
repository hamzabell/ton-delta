import { NextResponse } from 'next/server';
import { watchmanQueue } from '@/workers/queues';

export const dynamic = 'force-dynamic';

/**
 * Background Service Scheduler
 * Initializes recurring jobs for all worker tasks
 */
export async function GET() {
  try {
    // Schedule Entry Job - Processes pending position entries
    await watchmanQueue.add(
      'entry-job',
      {},
      {
        repeat: {
          pattern: '*/30 * * * * *', // Every 30 seconds
        },
        jobId: 'entry-job-recurring',
      }
    );

    // Schedule Valuation Job - Updates position valuations
    await watchmanQueue.add(
      'valuation-job',
      {},
      {
        repeat: {
          pattern: '*/60 * * * * *', // Every 60 seconds
        },
        jobId: 'valuation-job-recurring',
      }
    );

    // Schedule Drift Monitor - Monitors delta drift
    await watchmanQueue.add(
      'drift-monitor',
      {},
      {
        repeat: {
          pattern: '*/120 * * * * *', // Every 2 minutes
        },
        jobId: 'drift-monitor-recurring',
      }
    );

    // Schedule Safety Check - Monitors max loss thresholds
    await watchmanQueue.add(
      'safety-check',
      {},
      {
        repeat: {
          pattern: '*/60 * * * * *', // Every 60 seconds
        },
        jobId: 'safety-check-recurring',
      }
    );

    // Schedule Keeper Monitor - Detects refund trigger payments
    await watchmanQueue.add(
      'keeper-monitor',
      {},
      {
        repeat: {
          pattern: '*/30 * * * * *', // Every 30 seconds
        },
        jobId: 'keeper-monitor-recurring',
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Background service initialized',
      jobs: [
        { name: 'entry-job', interval: '30s' },
        { name: 'valuation-job', interval: '60s' },
        { name: 'drift-monitor', interval: '120s' },
        { name: 'safety-check', interval: '60s' },
        { name: 'strategy-job', interval: '180s' },
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
