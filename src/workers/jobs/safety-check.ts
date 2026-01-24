import { Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { ExecutionService } from '../../lib/execution';
import { getTonBalance } from '../../lib/onChain';
import { getPosition$, getMarkPrice$ } from '../../lib/storm';
import { stonfi } from '../../lib/stonfi';
import { firstValueFrom } from 'rxjs';
import { fromNano } from '@ton/core';
import { EMAService } from '../../lib/ema';

export async function safetyCheckJob(job: Job) {
  const { positionId } = job.data;

  if (positionId) {
    return await processPositionSafety(positionId);
  }

  // Global Check
  const activePositions = await prisma.position.findMany({
    where: { status: 'active' }
  });

  const results = [];
  for (const position of activePositions) {
    try {
      const result = await processPositionSafety(position.id);
      results.push({ positionId: position.id, ...result });
    } catch (err) {
      console.error(`[Watchman] Failed safety check for ${position.id}:`, err);
      results.push({ positionId: position.id, error: String(err) });
    }
  }

  return { processed: activePositions.length, results };
}

async function processPositionSafety(positionId: string) {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { user: true }
  });

  if (!position) return { skipped: true };

  try {
      const ticker = position.pairId.split('-')[0].toUpperCase();
      const vaultAddr = position.vaultAddress || position.user?.walletAddress;
      if (!vaultAddr) throw new Error('No vault address found for position');
      
      // 1. Real Spot Base Amount
      let realSpotAmount = 0;
      if (ticker === 'TON') {
          const bal = await getTonBalance(vaultAddr);
          realSpotAmount = Number(fromNano(bal));
      } else {
          realSpotAmount = position.spotAmount; // Fallback
      }

      // 2. Real Perp Position
      const perpPos = await firstValueFrom(getPosition$(ticker, vaultAddr));
      const realPerpAmount = perpPos.amount;

      // 3. Prices (Spot + Mark)
      const rawSpotPrice = await firstValueFrom(stonfi.getSpotPrice$('TON', 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixDn7Nx24_USDT'));
      
      await EMAService.pushPrice('TON', rawSpotPrice);
      const spotPrice = (await EMAService.getEMA('TON', 300)) || rawSpotPrice;
      const perpMarkPrice = await firstValueFrom(getMarkPrice$(ticker));

      // 4. Calculate Real Equity
      const spotValue = realSpotAmount * spotPrice;
      const perpValue = realPerpAmount * (2 - (perpMarkPrice / position.entryPrice));
      const realTotalEquity = spotValue + perpValue;

      const isEmergency = realTotalEquity < position.principalFloor;

      if (isEmergency) {
        console.warn(`[Watchman] EMERGENCY UNWIND for ${positionId} (Equity: ${realTotalEquity} < Floor: ${position.principalFloor})`);
        
        try {
            await ExecutionService.executePanicUnwind(positionId, "Safety Check: Equity below Principal Floor");
            return { emergencyTriggered: true, executed: true };

        } catch (error) {
            console.error(`[Watchman] CRITICAL: Failed to execute Emergency Unwind for ${positionId}`, error);
            await prisma.position.update({
                where: { id: positionId },
                data: { status: 'emergency' }
            });
            throw error; 
        }
      }

      return { emergencyTriggered: false };
  } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error(`[Watchman] CRITICAL: Failed to safety check ${positionId} on-chain.`, e.message);
      return { error: e.message };
  }
}

