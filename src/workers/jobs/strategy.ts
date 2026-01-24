import { Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { ExecutionService } from '../../lib/execution';
import { Logger } from '../../services/logger';
import { getFundingRate$ } from '../../lib/storm';
import { firstValueFrom } from 'rxjs';

// Configuration Defaults
const FUNDING_ENTRY_THRESHOLD = 0.01; // 1% APY minimum to enter
const DELEGATION_SAFETY_BUFFER_MS = 60 * 60 * 1000; // 1 Hour

export const strategyJob = async (job: Job) => {
    const startTime = Date.now();
    const logCtx = 'strategy-job';
    Logger.info(logCtx, `Starting strategy cycle...`, job.id);

    let itemsProcessed = 0;
    
    try {
        // 2. Fetch Market Data (Optimization: Fetch once for all positions using same pair)
        // MOVED: Fetching inside loop to support multiple pairs


        // 1. Fetch All Active & Stasis Positions
        const positions = await prisma.position.findMany({
            where: { status: { in: ['active', 'stasis'] } },
            include: { user: true }
        });

        for (const position of positions) {
            try {
                itemsProcessed++;
                
                // --- A. DELEGATION SAFETY CHECK ---
                // We rely on the stored 'delegationExpiry' field in DB which should be set upon delegation.
                // In a future update, we can implement on-chain verification by decoding W5 state.
                const delegationExpiry = position.delegationExpiry ? new Date(position.delegationExpiry).getTime() : Date.now() + 24 * 60 * 60 * 1000 * 30; // Default 30 days if missing (safety)
                const timeRemaining = delegationExpiry - Date.now();

                if (timeRemaining < DELEGATION_SAFETY_BUFFER_MS) {
                    Logger.warn(logCtx, 'LOW DELEGATION TIME', position.id);
                    await ExecutionService.executePanicUnwind(position.id, "Delegation Expiry Imminent");
                    continue; 
                }

                // --- B. STRATEGY STATE MACHINE ---
                const ticker = position.pairId.split('-')[0].toUpperCase();
                const fundingRate = await firstValueFrom(getFundingRate$(ticker));

                if (position.status === 'stasis') {
                    // MODE: Stasis (Cash)
                    // Check for Re-entry (Positive Funding Return)
                    if (fundingRate > FUNDING_ENTRY_THRESHOLD) {
                        Logger.info(logCtx, `Funding Positive (${fundingRate}%). Re-entering Basis Mode.`, position.id);
                        
                        await ExecutionService.exitStasis(position.id);
                        
                        Logger.info(logCtx, 'EXIT_STASIS requested', position.id, { fundingRate });
                    }
                } else if (position.status === 'active') {
                    // MODE: Active Basis Trade
                    // Check for Negative Funding (Backwardation)
                    if (fundingRate < 0) {
                        Logger.info(logCtx, `Negative Funding (${fundingRate}%). Retreating to Stasis.`, position.id);
                        
                        await ExecutionService.enterStasis(position.id);

                        Logger.info(logCtx, 'ENTER_STASIS requested', position.id, { fundingRate });
                    }
                }

            } catch (posError: unknown) {
                const errorMsg = posError instanceof Error ? posError.message : String(posError);
                Logger.error(logCtx, 'Error processing position', position.id, { error: errorMsg });
            }
        }

        // Log Run Success
        await prisma.jobRun.create({
            data: {
                workerName: 'strategy-job',
                status: 'SUCCESS',
                durationMs: Date.now() - startTime,
                itemsProcessed
            }
        });

    } catch (error: unknown) {
        Logger.error(logCtx, 'CRITICAL FAILURE', job.id, { error: error instanceof Error ? error.message : String(error) });
        // Log Run Failure
        const stack = error instanceof Error ? error.stack : String(error);
        await prisma.jobRun.create({
            data: {
                workerName: 'strategy-job',
                status: 'FAILURE',
                durationMs: Date.now() - startTime,
                errorStack: stack
            }
        });
    }
};

/**
 * Panic Unwind Helper - DEPRECATED: Use ExecutionService
 */
