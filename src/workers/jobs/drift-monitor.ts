// Job type removed - using generic job interface
import { prisma } from '../../lib/prisma';
import { ExecutionService } from '../../lib/execution';
import { getTonBalance } from '../../lib/onChain';
import { getPosition$ } from '../../lib/storm';
import { firstValueFrom } from 'rxjs';
import { fromNano } from '@ton/core';

interface Job {
  id: string;
  name: string;
  data: Record<string, any>;
}

export async function driftMonitorJob(job: Job) {
  const { positionId } = job.data;
  
  if (positionId) {
    return await processPositionDrift(positionId);
  }

  // Global Check: Fetch all active positions
  const activePositions = await prisma.position.findMany({
    where: { status: 'active' }
  });

  const results = [];
  for (const position of activePositions) {
    try {
      const result = await processPositionDrift(position.id);
      results.push({ positionId: position.id, ...result });
    } catch (err) {
      console.error(`[Watchman] Failed to process drift for ${position.id}:`, err);
      results.push({ positionId: position.id, error: String(err) });
    }
  }

  return { processed: activePositions.length, results };
}

async function processPositionDrift(positionId: string) {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { user: true }
  });

  if (!position || position.status !== 'active') return { skipped: true };

  try {
      // 1. Fetch Real Spot Balance & Gas Check
      const ticker = position.pairId.split('-')[0].toUpperCase();
      const vaultAddr = position.vaultAddress || position.user?.walletAddress;
      if (!vaultAddr) throw new Error('No vault address found for position');
      
      const balanceNano = await getTonBalance(vaultAddr);
      const balanceTON = Number(fromNano(balanceNano));

      // GAS/SOLVENCY CHECK
      // If funds are too low to rebalance or perform operations, trigger exit.
      // Threshold: 0.15 TON (Keeper ops cost ~0.05-0.1)
      if (balanceTON < 0.15) {
           console.warn(`[Watchman] LOW FUNDS (${balanceTON} TON) for ${positionId}. Triggering Force Exit.`);
           await ExecutionService.forceVaultExit(positionId, vaultAddr, position.user!.walletAddress!);
           return { exitTriggered: true, balanceTON };
      }

      let realSpotAmount = 0;
      if (ticker === 'TON') {
          realSpotAmount = balanceTON;
      } else {
          console.warn(`[Watchman] Jetton checking not fully configured for ${ticker}. Using DB Spot Amount.`);
          realSpotAmount = position.spotAmount; 
      }

      // 2. Fetch Real Perp Position
      const perpPos = await firstValueFrom(getPosition$(ticker, vaultAddr));
      const realPerpAmount = perpPos.amount;

      // 3. Calculate Drift
      const drift = Math.abs(realSpotAmount - realPerpAmount) / (realSpotAmount || 1);

      await prisma.position.update({
        where: { id: positionId },
        data: { driftCoefficient: drift }
      });

      // Threshold: 1.5% (0.015)
      if (drift > 0.015) {
        const delta = realSpotAmount - realPerpAmount; // Positive = Under-hedged
        console.log(`[Watchman] REBALANCE TRIGGERED for ${positionId} (Drift: ${drift}, Delta: ${delta})`);
        
        await ExecutionService.rebalanceDelta(positionId, delta);
        return { rebalanceTriggered: true, drift };
      }
      
      return { rebalanceTriggered: false, drift };

  } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error(`[Watchman] CRITICAL: Failed to verify on-chain state for ${positionId}. Skipping logic.`, e.message);
      return { error: e.message };
  }
}

