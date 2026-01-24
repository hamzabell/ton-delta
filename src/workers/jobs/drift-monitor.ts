import { Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { ExecutionService } from '../../lib/execution';
import { getTonBalance } from '../../lib/onChain';
import { getPosition$ } from '../../lib/storm';
import { firstValueFrom } from 'rxjs';
import { fromNano } from '@ton/core';

export async function driftMonitorJob(job: Job) {
  const { positionId } = job.data;
  
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { user: true }
  });

  if (!position || position.status !== 'active') return;



  try {
      // 1. Fetch Real Spot Balance
      // Assume Pair ID "ticker-ton" => Spot is Ticker? Or "ton-usdt" => Spot is TON?
      // For "Basis Trade" usually: Long Spot, Short Perp.
      // If pair is "TON-USDT", Spot is TON.
      // If pair is "DOGS-TON", Spot is DOGS.
      const ticker = position.pairId.split('-')[0].toUpperCase();
      const vaultAddr = position.vaultAddress || position.user?.walletAddress;
      if (!vaultAddr) throw new Error('No vault address found for position');
      
      let realSpotAmount = 0;
      if (ticker === 'TON') {
          const bal = await getTonBalance(vaultAddr);
          realSpotAmount = Number(fromNano(bal));
      } else {
          // TODO: Need Minter Address for Jetton. 
          // For now, assuming TON-only for MVP or failing gracefully.
          // In real app, we'd lookup Minter from Config or DB.
          // Fallback to TON balance if ticker is ambiguous or just log warning.
          console.warn(`[Watchman] Jetton checking not fully configured for ${ticker}. Using DB Spot Amount.`);
          realSpotAmount = position.spotAmount; 
      }

      // 2. Fetch Real Perp Position
      // This will throw if SDK is missing (current state)
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
      // "Only DB for logging" -> We do NOT fall back to DB logic. We skip.
      return { error: e.message };
  }
}
