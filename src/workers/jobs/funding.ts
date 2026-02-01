// Job type removed - using generic job interface

interface Job {
  id: string;
  name: string;
  data: Record<string, any>;
}
import { prisma } from '../../lib/prisma';
import { getFundingRate$ } from '../../lib/storm';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../../services/logger';
import { EMAService } from '../../lib/ema';
import { ExecutionService } from '../../lib/execution';

export const processFundingJob = async (job: Job) => {
    const logCtx = 'funding-job';
    Logger.info(logCtx, `Starting funding cycle...`, job.id);

    try {
        // 1. Get all active positions
        const positions = await prisma.position.findMany({
            where: { 
                status: { in: ['active', 'stasis', 'stasis_pending_stake', 'stasis_active'] } 
            },
            include: { user: true }
        });

        let eventsProcessed = 0;

        // Optimization: In a real scenario, group by pairId to fetch rates once per pair
        // For now, we iterate sequentially for simplicity.
        
        for (const position of positions) {
            try {
                const ticker = position.pairId.split('-')[0].toUpperCase();
                // Assume storm symbol format, e.g. "TON" or "NOT"
                // The getFundingRate$ implementation in storm.ts expects a symbol
                
                const fundingRate = await firstValueFrom(getFundingRate$(ticker));
                
                // Annualized Rate (approximate for display)
                const annualRate = fundingRate * 24 * 365 * 100; // Hourly rate * 24 * 365
                
                // Update Position Stats
                // Note: We might want to store 'lastFundingRate' on the position if the schema supports it.
                // For now, we'll log it and create a FundingEvent if it's positive (payment received).
                
                Logger.info(logCtx, `Rate for ${ticker} (Pos ${position.id}): ${fundingRate.toFixed(6)} (${annualRate.toFixed(2)}% APY)`);

                // Simulate Funding Payment (Accrual)
                // In a real perp, this settles into the margin balance. 
                // We track it as a discrete event for the UI "Yield" chart.
                const positionSize = position.perpAmount || 0;
                const estimatedPayout = positionSize * fundingRate;

                // --- FUNDING GUARD (New) ---
                // 1. Push Rate to History
                await EMAService.pushPrice(`funding:${ticker}`, fundingRate);

                // 2. Check 24h Average
                const avg24h = await EMAService.getEMA(`funding:${ticker}`, 24 * 60 * 60);
                
                if (avg24h !== null && avg24h < 0) {
                     // NEGATIVE FUNDING SPIRAL DETECTED
                     Logger.warn(logCtx, `Negative 24h Funding Average (${avg24h.toFixed(6)}) for ${ticker}. Triggering STASIS.`, position.id);
                     
                     // Trigger Stasis Mode (Soft Exit)
                     if (position.status === 'active') {
                         await ExecutionService.enterStasis(position.id);
                         continue; // Skip payment logic for this cycle as we are exiting
                     }
                }

                if (Math.abs(estimatedPayout) > 0) {
                     await prisma.fundingEvent.create({
                        data: {
                            positionId: position.id,
                            amount: estimatedPayout,
                            rate: fundingRate,
                            type: estimatedPayout > 0 ? 'PAYMENT' : 'DEDUCTION'
                        }
                    });
                    
                    eventsProcessed++;
                }

            } catch (err) {
                 Logger.error(logCtx, `Failed to process funding for ${position.id}`, '', { error: String(err) });
            }
        }

        return { status: 'success', positionsProcessed: positions.length, eventsCreated: eventsProcessed };

    } catch (error) {
        Logger.error(logCtx, 'CRITICAL_FAILURE', job.id, { error: String(error) });
        throw error;
    }
};
