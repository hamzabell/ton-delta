// Job type removed - using generic job interface

interface Job {
  id: string;
  name: string;
  data: Record<string, any>;
}
import { prisma } from '../../lib/prisma';
import { stonfi } from '../../lib/stonfi';
import { getMarkPrice$ } from '../../lib/storm';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../../services/logger';
import { getTonBalance } from '../../lib/onChain';
import { getPosition$ } from '../../lib/storm';
import { fromNano } from '@ton/core';

// Constants
const USDT_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixDn7Nx24_USDT'; // Mainnet USDT (verify if testnet needed)

export const valuationJob = async (job: Job) => {
    const logCtx = 'valuation-job';
    // Logger.info(logCtx, `Starting valuation cycle...`, job.id);

    try {
        const positions = await prisma.position.findMany({
            where: { status: { in: ['active', 'stasis', 'pending_entry_verification'] } },
            include: { user: true }
        });

        let updatedCount = 0;

        for (const position of positions) {
            try {
                // ... (existing price fetching logic) ...
                const ticker = position.pairId.split('-')[0].toUpperCase();
                
                // Match ticker
                const match = await stonfi.resolveTokenAddress(ticker);
                const isTon = ticker === 'TON';
                const tokenAddr = isTon ? undefined : match;

                // 1. Fetch Spot Price (in TON)
                let spotPrice = 1; // Default for TON-TON
                if (!isTon) {
                    // Get price of Ticker in TON
                    spotPrice = await firstValueFrom(stonfi.getSpotPrice$(ticker, 'TON'));
                }

                // If we have a valid price (or it's TON), proceed
                if (spotPrice > 0) {
                     // 2. Fetch Perp Mark Price (Storm)
                     const perpMarkPrice = await firstValueFrom(getMarkPrice$(ticker));
                     
                     // 2. Verified On-Chain Amounts
                     const vaultAddr = position.vaultAddress || position.user?.walletAddress;
                     if (!vaultAddr) throw new Error('No vault address for position');
                     
                     let realSpotAmount = 0;
                     if (isTon) {
                         const bal = await getTonBalance(vaultAddr);
                         realSpotAmount = Number(fromNano(bal));
                     } else if (tokenAddr) {
                         // Fetch Jetton Balance
                         const bal = await stonfi.getJettonBalance(vaultAddr, tokenAddr);
                         realSpotAmount = Number(fromNano(bal));
                     } else {
                         // Fallback if we can't resolve address but have a price? 
                         // Check only if we are verifying. If active, maybe trust DB or 0?
                         // For safety, default 0.
                         realSpotAmount = 0;
                     }
                     
                     const perpPos = await firstValueFrom(getPosition$(ticker, vaultAddr));
                     const realPerpAmount = perpPos.amount;

                     // 3. Status Transition Logic
                     // If we are in 'pending_entry_verification', check if trades have landed
                     let newStatus = position.status;
                     const now = Date.now();

                     if (position.status === 'pending_entry_verification') {
                         // Condition: Both spot and perp amounts are detected on-chain
                         // For 1x short, realPerpAmount should be close to expected.
                         // For Spot, we expect some balance.
                         if (realSpotAmount > 0 && realPerpAmount > 0) {
                             Logger.info(logCtx, `Entry Verified for Position ${position.id}. Transitioning to Active.`, position.id);
                             newStatus = 'active';
                             
                             // POST-ENTRY SETUP (Stop Loss)
                             // Since we couldn't bundle SL atomically (position wasn't deployed),
                             // we trigger it now that the position is active.
                             try {
                                 const { ExecutionService } = await import('../../lib/execution');
                                 // Fire and forget (don't await to avoid blocking valuation loop long-term?)
                                 // Or await to confirm? Use catch to prevent loop crash.
                                 ExecutionService.ensureStopLoss(position.id).catch(e => 
                                    Logger.error(logCtx, 'Post-Entry SL Failed', position.id, { error: String(e) })
                                 );
                             } catch (e) {
                                  Logger.error(logCtx, 'Could not import ExecutionService', position.id);
                             }
                             
                             // Try to set simulated hashes if missing (since we verified)
                             // Or leave them for explorer fallback logic
                         } else {
                             // Check for timeout (Stuck > 5 mins)
                             const timeStuckMs = now - new Date(position.updatedAt).getTime();
                             if (timeStuckMs > 5 * 60 * 1000) {
                                 Logger.warn(logCtx, `Position ${position.id} stuck in verification for ${Math.round(timeStuckMs/1000)}s. Resetting to 'pending_entry' for retry.`, position.id);
                                 newStatus = 'pending_entry';
                             } else {
                                Logger.info(logCtx, `Entry Still Pending for Position ${position.id}. Spot: ${realSpotAmount}, Perp: ${realPerpAmount}`, position.id);
                                continue; // Skip valuation update until trades land
                             }
                         }
                     }

                     // 4. Verified Equity Calculation
                     const spotValue = realSpotAmount * spotPrice;
                     const entryPrice = position.entryPrice;
                     const perpValue = realPerpAmount * (2 - (perpMarkPrice / entryPrice));
                     const totalEquity = spotValue + perpValue;

                     await prisma.position.update({
                         where: { id: position.id },
                         data: {
                             status: newStatus,
                             currentPrice: spotPrice,
                             spotValue: spotValue,
                             perpValue: perpValue,
                             totalEquity: totalEquity,
                         }
                     });
                     
                     updatedCount++;
                }

            } catch (pErr) {
                Logger.error(logCtx, `Valuation failed for ${position.id}`, '', { error: String(pErr) });
            }
        }

        return { status: 'success', positionsUpdated: updatedCount };

    } catch (error) {
        Logger.error(logCtx, 'CRITICAL_FAILURE', job.id, { error: String(error) });
        throw error;
    }
};
