import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { ExecutionService } from '../lib/execution';
import { Logger } from '../services/logger';

async function refundAllOpenPositions() {
    const logCtx = 'refund-script';
    Logger.info(logCtx, 'Starting bulk refund of all open positions...');

    try {
        const positions = await prisma.position.findMany({
            where: { 
                status: { 
                    in: ['active', 'stasis', 'stasis_pending_stake', 'stasis_active'] 
                } 
            }
        });

        Logger.info(logCtx, `Found ${positions.length} positions to refund.`);

        const processedVaults = new Set<string>();

        for (const position of positions) {
            try {
                if (processedVaults.has(position.vaultAddress)) {
                    Logger.info(logCtx, `Skipping position ${position.id}, vault ${position.vaultAddress} already processed.`);
                    continue;
                }

                Logger.info(logCtx, `Triggering refund for position ${position.id} (${position.pairId}) from vault ${position.vaultAddress}...`);
                
                // Reason reflects the user's request for "System Sunset / Pair Transition"
                await ExecutionService.executePanicUnwind(
                    position.id, 
                    "System-wide position refund triggered by admin",
                    "UQBF63kZHYMgnKWTlF2rxHIMlAFPN-gOMH7GXkONFgRAs44V"
                );
                
                processedVaults.add(position.vaultAddress);
                
                Logger.info(logCtx, `Successfully triggered refund for ${position.id}`);
                
                // Delay to avoid 429
                await new Promise(resolve => setTimeout(resolve, 10000));
            } catch (err) {
                Logger.error(logCtx, `Failed to refund position ${position.id}`, '', { error: String(err) });
            }
        }

        Logger.info(logCtx, 'Bulk refund complete.');
    } catch (error) {
        Logger.error(logCtx, 'CRITICAL FAILURE in refund script', '', { error: String(error) });
    } finally {
        await prisma.$disconnect();
    }
}

refundAllOpenPositions();
