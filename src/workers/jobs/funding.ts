import { Job } from 'bullmq';
import ccxt from 'ccxt';
import prisma from '../../lib/prisma';

// Mock Exchange for MVP to avoid needing real API keys immediately
const mockExchange = {
  fetchFundingRate: async (symbol: string) => {
    // Return a random positive funding rate between 0.01% and 0.05%
    return {
      fundingRate: 0.0001 + Math.random() * 0.0004,
      timestamp: Date.now(),
    };
  }
};

export const processFundingJob = async (job: Job) => {
  console.log(`[Funding] Harvesting yields for active strategies...`);

  // 1. Get all active strategies
  // Note: specific Prisma types might need adjustment depending on schema state, using 'any' for loose coupling in this step
  const strategies = await prisma.strategy.findMany();

  for (const strategy of strategies) {
    try {
      // 2. Fetch Funding Rate from Binance (or Map ticker to Symbol)
      // e.g. DOGE -> DOGE/USDT:USDT
      const rateData = await mockExchange.fetchFundingRate(strategy.cexSymbol || 'DOGE/USDT:USDT');
      
      const rate = rateData.fundingRate;
      const annualRate = rate * 3 * 365 * 100; // 3 payments per day * 365 days * percentage
      
      console.log(`[Funding] ${strategy.ticker}: Rate=${rate.toFixed(6)} (${annualRate.toFixed(2)}% APY)`);

      // 3. Update Strategy APY
      await prisma.strategy.update({
        where: { id: strategy.id },
        data: { currentApy: annualRate },
      });

      // 4. Record Funding Event (Simulated based on TVL)
      // For MVP, we assume 100% of TVL is hedged
      const payout = strategy.tvl * rate;
      if (payout > 0) {
        await prisma.fundingEvent.create({
            data: {
                strategyId: strategy.id,
                amount: payout,
                timestamp: new Date(),
            }
        });
        console.log(`[Funding] 💰 Distributed $${payout.toFixed(2)} to ${strategy.ticker} Vault`);
      }

    } catch (error) {
      console.error(`[Funding] Error processing ${strategy.ticker}:`, error);
    }
  }

  return { status: 'success', strategiesProcessed: strategies.length };
};
