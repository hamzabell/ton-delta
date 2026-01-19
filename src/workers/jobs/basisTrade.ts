import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { getSpotPrice$, buildSwapTransaction$ } from '../../lib/swapcoffee';
import { getMarkPrice$ } from '../../lib/storm';
import { sendTransactions$, getKeeperWallet$ } from '../../lib/custodialWallet';
import { toNano } from 'ton-core';
import { from, zip, of, lastValueFrom } from 'rxjs';
import { map, switchMap, catchError, concatMap } from 'rxjs/operators';

const SPREAD_THRESHOLD = 0.005; // 0.5% premium to enter

export const processBasisJob = async (job: Job) => {
  console.log(`[Basis] Scanning for custodial arbitrage (swap.coffee RxJS Stream vs Storm)...`);

  // 1. Get all Basis strategies as a stream
  const strategies$ = from(prisma.strategy.findMany({
    where: { type: 'BASIS' }
  }));

  const processStrategies$ = strategies$.pipe(
    switchMap(strategies => {
      if (strategies.length === 0) {
        console.log(`[Basis] No active BASIS strategies found.`);
        return of({ status: 'idle' });
      }

      // Process each strategy sequentially to avoid seqno conflicts
      return from(strategies).pipe(
        concatMap(strategy => {
          const fromAddr = strategy.fromAsset || 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
          const toAddr = strategy.toAsset || 'EQCxE6mUt_9sXn39O_9t-JLo-zic7Sj1f_O1-8g6f_S0';

          return zip(
            getSpotPrice$(fromAddr, toAddr).pipe(map(p => ({ spot: p }))),
            getMarkPrice$(strategy.ticker || 'TON').pipe(map(p => ({ future: p })))
          ).pipe(
            switchMap(([{ spot }, { future }]) => {
              const basis = (future - spot) / spot;
              const annualBasis = basis * (365 / 90) * 100;

              console.log(`[Basis] ${strategy.ticker}: spot=$${spot}, future=$${future}, Basis=${(basis * 100).toFixed(2)}%`);

              // Update APY in DB
              const updateApy$ = from(prisma.strategy.update({
                where: { id: strategy.id },
                data: { currentApy: annualBasis }
              }));

              // Execution Logic
              if (basis > SPREAD_THRESHOLD) {
                console.log(`[Basis] 🚨 TRIGGER: ${(basis * 100).toFixed(2)}% spread detected.`);
                
                return getKeeperWallet$().pipe(
                  switchMap(({ contract }) => {
                    const amountToSwap = toNano('10').toString();
                    return buildSwapTransaction$({
                      senderAddress: contract.address.toString(),
                      fromAddress: fromAddr,
                      toAddress: toAddr,
                      amount: amountToSwap,
                      slippage: 0.01
                    }).pipe(
                      switchMap(transactions => sendTransactions$(transactions)),
                      switchMap(result => from(prisma.transaction.create({
                        data: {
                          strategyId: strategy.id,
                          type: 'SWAP',
                          status: 'SUCCESS',
                          txHash: `rxjs_tx_${Date.now()}`,
                          fromAsset: fromAddr,
                          toAsset: toAddr,
                          amount: 10,
                          basisCaptured: basis
                        }
                      }))),
                      map(() => {
                        console.log(`[Basis] ✅ Custodial swap executed for ${strategy.ticker}`);
                        return strategy;
                      })
                    );
                  })
                );
              }

              return updateApy$.pipe(map(() => strategy));
            }),
            catchError(err => {
              console.error(`[Basis] Error processing strategy ${strategy.ticker}:`, err);
              return of(null);
            })
          );
        })
      );
    })
  );

  await lastValueFrom(processStrategies$);
  return { status: 'success' };
};
