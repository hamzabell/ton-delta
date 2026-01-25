import { Job } from 'bullmq';
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
                
                let spotPrice = 0;
                if (ticker === 'TON') {
                     spotPrice = await firstValueFrom(stonfi.getSpotPrice$('TON', USDT_ADDRESS));
                } else {
                     spotPrice = 0; // Skip for now if unknown
                }

                if (spotPrice > 0) {
                     // 2. Fetch Perp Mark Price (Storm)
                     const perpMarkPrice = await firstValueFrom(getMarkPrice$(ticker));
                     
                     // 2. Verified On-Chain Amounts
                     const vaultAddr = position.vaultAddress || position.user?.walletAddress;
                     if (!vaultAddr) throw new Error('No vault address for position');
                     
                     let realSpotAmount = 0;
                     if (ticker === 'TON') {
                         const bal = await getTonBalance(vaultAddr);
                         realSpotAmount = Number(fromNano(bal));
                     } else {
                         realSpotAmount = position.spotAmount; 
                     }
                     
                     const perpPos = await firstValueFrom(getPosition$(ticker, vaultAddr));
                     const realPerpAmount = perpPos.amount;

                     // 3. Status Transition Logic
                     // If we are in 'pending_entry_verification', check if trades have landed
                     let newStatus = position.status;
                     if (position.status === 'pending_entry_verification') {
                         // Condition: Both spot and perp amounts are detected on-chain
                         // For 1x short, realPerpAmount should be close to expected
                         if (realSpotAmount > 0 && realPerpAmount > 0) {
                             Logger.info(logCtx, `Entry Verified for Position ${position.id}. Transitioning to Active.`, position.id);
                             newStatus = 'active';
                         } else {
                             Logger.info(logCtx, `Entry Still Pending for Position ${position.id}. Spot: ${realSpotAmount}, Perp: ${realPerpAmount}`, position.id);
                             continue; // Skip valuation update until trades land to avoid noisy data
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
