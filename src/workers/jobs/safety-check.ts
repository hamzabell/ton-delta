import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';

export async function safetyCheckJob(job: Job) {
  const { positionId } = job.data;

  const position = await prisma.position.findUnique({
    where: { id: positionId }
  });

  if (!position) return;

  // E_total < E_floor ?
  const isEmergency = position.totalEquity < position.principalFloor;

  if (isEmergency) {
    console.warn(`[Watchman] EMERGENCY UNWIND for ${positionId}`);
    
    // In real app: Add to emergencyQueue
    await prisma.position.update({
      where: { id: positionId },
      data: { status: 'emergency' }
    });

    return { emergencyTriggered: true };
  }

  return { emergencyTriggered: false };
}
