import { Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { ExecutionService } from '../../lib/execution';
import { Logger } from '../../services/logger';

export const processEntryJob = async (job: Job) => {
  const logCtx = 'entry-job';
  Logger.info(logCtx, `Starting entry cycle...`, job.id);

  try {
    // 1. Find all positions waiting for entry
    // Assumes positions created by deposits.ts or API have status 'pending_entry'
    // OR we check for active positions with 0 stats.
    // For now, let's use a specific status to be safe.
    // If schema doesn't have 'pending_entry', we might need to rely on 'active' + spotAmount == 0.
    // Let's assume we update the enum or use 'active' with check.
    const pendingPositions = await prisma.position.findMany({
      where: {
        OR: [
          { status: 'pending_entry' },
          { status: 'active', spotAmount: 0, perpAmount: 0 } // Fallback for active but empty
        ]
      },
      include: { user: true }
    });

    let processed = 0;

    for (const position of pendingPositions) {
      // Safety check: specific status override allows bypass
      if ((position.spotAmount > 0 || position.perpAmount > 0) && position.status !== 'pending_entry') continue; 

      try {
        Logger.info(logCtx, `Attempting Entry for Position ${position.id}`, position.userId);
        
        await ExecutionService.enterInitialPosition(position.id);
        
        processed++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        Logger.error(logCtx, `Entry Failed for ${position.id}`, '', { error: errorMsg });
      }
    }

    return { status: 'success', processed };

  } catch (error) {
    Logger.error(logCtx, 'CRITICAL_FAILURE', job.id, { error: String(error) });
    throw error;
  }
};
