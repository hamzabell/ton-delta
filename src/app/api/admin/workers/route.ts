import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subHours } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check workers active in the last 1 hour
    const threshold = subHours(new Date(), 1);

    const recentRuns = await prisma.jobRun.groupBy({
      by: ['workerName', 'status'],
      where: {
        startTime: { gte: threshold }
      },
      _count: {
        status: true
      },
      _max: {
        startTime: true
      }
    });

    // Transform into clean worker status list
    const workerStats = new Map<string, { 
      name: string, 
      lastSeen: Date | null, 
      successCount: number, 
      failureCount: number, 
      status: 'HEALTHY' | 'DEGRADED' | 'DOWN' 
    }>();

    // Initialize known workers
    ['strategy-job', 'risk-monitor', 'funding-monitor'].forEach(name => {
      workerStats.set(name, { 
        name, 
        lastSeen: null, 
        successCount: 0, 
        failureCount: 0, 
        status: 'DOWN' 
      });
    });

    recentRuns.forEach(run => {
      const current = workerStats.get(run.workerName) || { 
        name: run.workerName, 
        lastSeen: null, 
        successCount: 0, 
        failureCount: 0, 
        status: 'DOWN' 
      };

      if (run.status === 'SUCCESS') current.successCount = run._count.status;
      if (run.status === 'FAILURE') current.failureCount = run._count.status;
      
      const runLastSeen = run._max.startTime;
      if (runLastSeen && (!current.lastSeen || runLastSeen > current.lastSeen)) {
        current.lastSeen = runLastSeen;
      }
      
      workerStats.set(run.workerName, current);
    });

    // Determine status
    const workers = Array.from(workerStats.values()).map(w => {
      if (!w.lastSeen) return { ...w, status: 'DOWN' };
      
      const failureRate = w.failureCount / (w.successCount + w.failureCount);
      if (failureRate > 0.1) return { ...w, status: 'DEGRADED' }; // >10% failure
      
      return { ...w, status: 'HEALTHY' };
    });

    return NextResponse.json({ workers });

  } catch (error) {
    console.error('[Admin API] Worker Health Error:', error);
    return NextResponse.json({ error: 'Failed to fetch worker health' }, { status: 500 });
  }
}
