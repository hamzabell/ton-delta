import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Active positions count
    const activePositions = await prisma.position.count({
      where: { status: 'active' }
    });
    
    // Total TVL (sum of totalEquity for active positions)
    const tvlData = await prisma.position.aggregate({
      where: { status: 'active' },
      _sum: { totalEquity: true }
    });
    
    // Recent errors (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentErrors = await prisma.auditLog.count({
      where: {
        level: 'ERROR',
        timestamp: { gte: oneDayAgo }
      }
    });
    
    // Worker job statuses (last 10 runs)
    const recentJobs = await prisma.jobRun.findMany({
      orderBy: { startTime: 'desc' },
      take: 10
    });
    
    // Calculate success rate
    const successfulJobs = recentJobs.filter(j => j.status === 'SUCCESS').length;
    const jobSuccessRate = recentJobs.length > 0 
      ? (successfulJobs / recentJobs.length) * 100 
      : 100;
    
    return NextResponse.json({
      activePositions,
      totalTVL: tvlData._sum.totalEquity || 0,
      recentErrors24h: recentErrors,
      workerHealth: {
        successRate: jobSuccessRate.toFixed(1),
        recentJobs: recentJobs.slice(0, 5).map(j => ({
          worker: j.workerName,
          status: j.status,
          duration: j.durationMs,
          timestamp: j.startTime
        }))
      }
    });
    
  } catch (error) {
    console.error('System Health API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    );
  }
}
