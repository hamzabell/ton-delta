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
            where: { status: { in: ['active', 'stasis'] } },
            include: { user: true }
        });

        let updatedCount = 0;

        for (const position of positions) {
            try {
                // 1. Get Spot Price (e.g. TON/USDT)
                // Assuming pairId is "TON-USDT" or "DOGE-TON"
                // Ideally position stores base/quote addresses. For MVP we infer from pairId or config.
                // If pairId is 'dogs-ton', base is DOGS, quote is TON.
                // Let's assume pairId is "TICKER-QUOTE".
                
                // For now, let's hardcode checking "TON" price if we are just tracking TON value,
                // But generally we need the price of the 'Spot Asset' in terms of 'Quote Asset' (usually TON or USDT).
                
                // Strategy: 
                // Spot Value = spotAmount * Price(SpotToken -> QuoteToken)
                // Perp Value = perpAmount (Margin) + PnL
                // Total Equity = Spot Value + Perp Value
                
                // Simplified: We just update the 'currentPrice' of the Base Asset.
                const ticker = position.pairId.split('-')[0].toUpperCase();
                
                // Fetch Price from Ston.fi (Spot)
                // Note: We need the address for the ticker. 
                // Ideally this is stored in a 'Token' table. 
                // For MVP we might need a mapper or pass the string if stonfi.ts handles it.
                // Our updated stonfi.ts handles 'TON' string. Others need address.
                
                // Let's rely on pairId having the address or a known symbol map.
                // If ticker is NOT 'TON', we might need to look it up.
                // Assuming we pass 'TON' for now as the main pair.
                
                let spotPrice = 0;
                if (ticker === 'TON') {
                     spotPrice = await firstValueFrom(stonfi.getSpotPrice$('TON', USDT_ADDRESS));
                } else {
                    // TODO: Lookup address for ticker
                     spotPrice = 0; // Skip for now if unknown
                }

                if (spotPrice > 0) {
                     // 2. Fetch Perp Mark Price (Storm) to sanity check or calc PnL
                     const perpMarkPrice = await firstValueFrom(getMarkPrice$(ticker));
                     
                     // 2. Verified On-Chain Amounts
                     const vaultAddr = position.vaultAddress || position.user?.walletAddress;
                     if (!vaultAddr) throw new Error('No vault address for position');
                     let realSpotAmount = 0;
                     if (ticker === 'TON') {
                         const bal = await getTonBalance(vaultAddr);
                         realSpotAmount = Number(fromNano(bal));
                     } else {
                         // Fallback/Warning for Jettons until configured
                         realSpotAmount = position.spotAmount; 
                     }
                     const perpPos = await firstValueFrom(getPosition$(ticker, vaultAddr));
                     const realPerpAmount = perpPos.amount;

                     // 3. Verified Equity Calculation
                     const spotValue = realSpotAmount * spotPrice;
                     
                     // Perp Equity (Simplified 1x Short Model)
                     // Value = Margin * (2 - Mark/Entry)
                     const entryPrice = position.entryPrice;
                     const perpValue = realPerpAmount * (2 - (perpMarkPrice / entryPrice));
                     
                     const totalEquity = spotValue + perpValue;

                     await prisma.position.update({
                         where: { id: position.id },
                         data: {
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
