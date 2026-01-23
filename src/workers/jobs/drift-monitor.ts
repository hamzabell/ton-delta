import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { ExecutionService } from '@/lib/execution';
// import { calculateDrift } from '@/lib/math'; // TODO: Implement math utils

export async function driftMonitorJob(job: Job) {
  const { positionId } = job.data;
  
  const position = await prisma.position.findUnique({
    where: { id: positionId }
  });

  if (!position || position.status !== 'active') return;

  // Calculate Drift: δ = |(Q_spot - Q_perp) / Q_initial|
  // Simplified for prototype:
  const drift = Math.abs(position.spotAmount - position.perpAmount) / (position.spotAmount || 1);

  await prisma.position.update({
    where: { id: positionId },
    data: { driftCoefficient: drift }
  });

  // Threshold: 1.5% (0.015)
  if (drift > 0.015) {
    const delta = position.spotAmount - position.perpAmount; // Positive = Under-hedged
    console.log(`[Watchman] REBALANCE TRIGGERED for ${positionId} (Drift: ${drift}, Delta: ${delta})`);
    
    try {
        await ExecutionService.rebalanceDelta(positionId, delta);
        console.log(`[Watchman] Rebalance Success`);
    } catch (e) {
        console.error(`[Watchman] Rebalance Failed:`, e);
    }
    
    return { rebalanceTriggered: true, drift };
  }

  return { rebalanceTriggered: false, drift };
}
