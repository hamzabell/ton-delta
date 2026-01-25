import { Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { getTonClient, withRetry } from '../../lib/onChain';
import { Address, fromNano } from '@ton/core';
import { Logger } from '../../services/logger';
import { ExecutionService } from '../../lib/execution';

/**
 * Keeper Monitor Job
 * Polls the Keeper's transaction history to detect 0.05 TON "trigger" deposits.
 * If detected, it matches the sender to an active position and initiates a refund.
 */
export const keeperMonitorJob = async (job: Job) => {
    const logCtx = 'keeper-monitor';
    const keeperAddrStr = process.env.NEXT_PUBLIC_KEEPER_ADDRESS;
    
    if (!keeperAddrStr) {
        Logger.error(logCtx, 'NEXT_PUBLIC_KEEPER_ADDRESS not configured');
        return { status: 'error', error: 'config_missing' };
    }

    try {
        const client = await getTonClient();
        const keeperAddress = Address.parse(keeperAddrStr);

        // 1. Get recent transactions for the Keeper
        // We look at the last 20 transactions to keep it efficient and avoid missing quick successions.
        const transactions = await withRetry(c => c.getTransactions(keeperAddress, { limit: 20 }));

        let triggeredCount = 0;

        for (const tx of transactions) {
            // Incoming transactions only
            if (!tx.inMessage || tx.inMessage.info.type !== 'internal') continue;

            const valueNano = tx.inMessage.info.value.coins;
            const valueTON = Number(fromNano(valueNano));
            const sender = tx.inMessage.info.src;
            
            // 2. Check for "refund" comment in body
            let isRefundTrigger = false;
            let targetPositionId: string | null = null;
            let comment = '';

            try {
                // Parse body as comment
                // comment declared above
                try {
                    const body = tx.inMessage.body.beginParse();
                    if (body.remainingBits > 0) {
                        try {
                            const opcode = body.loadUint(32);
                            if (opcode === 0) {
                                comment = body.loadStringTail();
                            } else {
                                // Maybe it's just a raw string without opcode 0? (Some wallets do this)
                                // Reset pointer
                                const rawBody = tx.inMessage.body.beginParse();
                                comment = rawBody.loadStringTail();
                            }
                        } catch (parsingErr) {
                            // If loadStringTail fails, it might be refs or binary
                            // Try raw string fallback
                             const rawBody = tx.inMessage.body.beginParse();
                             try {
                                comment = rawBody.loadStringTail();
                             } catch (e) {
                                 // Ignore
                             }
                        }
                    }
                } catch (e) {
                     // Body parsing failed completely
                }

                comment = comment.toLowerCase().trim();
                
                if (comment.length > 0) {
                     Logger.info(logCtx, `Parsed Comment from ${sender.toString()}: "${comment}"`);
                }

                if (comment.includes('refund')) {
                    isRefundTrigger = true;
                    
                    // Extract position ID if present (e.g. "refund uuid" or just "refunduuid")
                    const parts = comment.split(' ');
                    const potentialId = parts.length > 1 ? parts[1].trim() : comment.replace('refund', '').trim();
                    
                    if (potentialId && potentialId.length > 10) { // Simple check for UUID-like length
                        targetPositionId = potentialId;
                    }
                }
            } catch (e) {
                // Not a text comment or failed to parse
            }

            // 3. Check for Trigger Amount (~0.05 TON) and Memo
            // Allow range 0.045 - 0.1 to be safe against gas deduction or user generosity
            if (isRefundTrigger && valueTON >= 0.045) {
                const senderAddrStr = sender.toString({ bounceable: false });
                
                // 4. Match Position
                let position;
                if (targetPositionId) {
                    // Exact match by ID
                    position = await prisma.position.findUnique({
                        where: { id: targetPositionId },
                        include: { user: true }
                    });
                    
                    // Verify it belongs to this user (extra safety)
                    // Use Address.equals to handle format differences (Raw vs EQ/UQ)
                    let isOwner = false;
                    try {
                        if (position && position.user && position.user.walletAddress) {
                            const dbOwner = Address.parse(position.user.walletAddress);
                            if (dbOwner.equals(sender)) {
                                isOwner = true;
                            }
                        }
                    } catch (e) {
                         // Fallback to string check
                         if (position && position.user && position.user.walletAddress === senderAddrStr) isOwner = true;
                    }

                    if (position && !isOwner) {
                         const ownerAddr = position.user?.walletAddress || 'unknown';
                         Logger.warn(logCtx, `ID_MISMATCH: Refund ${targetPositionId} requested by ${senderAddrStr}, but owner is ${ownerAddr}`);
                         position = null;
                    }

                    // MANDATORY STATUS CHECK: Allow 'active' too, since API no longer sets 'processing_exit' eagerly.
                    // This allows the Keeper to be the source of truth for the state transition.
                    if (position && !['processing_exit', 'active'].includes(position.status)) {
                        Logger.warn(logCtx, `ID_MATCH_IGNORE: Refund triggered for ${position.id} with status ${position.status}. EXPECTED: active or processing_exit. Sender: ${senderAddrStr}`);
                        position = null;
                    }
                }

                if (!position && !targetPositionId) {
                    // Fallback to Sender + Status match (greedy) - ONLY if no ID was provided in memo
                    position = await prisma.position.findFirst({
                        where: {
                            user: { walletAddress: senderAddrStr },
                            status: { in: ['processing_exit', 'active'] } // Allow active for fallback match too
                        },
                        orderBy: { updatedAt: 'desc' }, 
                        include: { user: true }
                    });
                } else if (!position && targetPositionId) {
                    Logger.warn(logCtx, `ID_NOT_FOUND: Refund trigger with ID ${targetPositionId} but no matching position found or access denied.`, senderAddrStr);
                }

                if (isRefundTrigger && comment.includes('fee refund') && !targetPositionId) {
                     Logger.info(logCtx, `IGNORING self-refund/fee-return from ${sender.toString()}`);
                     continue;
                }

                if (position) {
                    Logger.info(logCtx, `TRIGGER_DETECTED: Refund request from ${sender.toString()} for position ${position.id}`);
                    
                    try {
                        const vaultAddr = position.vaultAddress || position.user.walletAddress!;
                        const userWallet = position.user.walletAddress || position.userId;

                        if (position.status !== 'closed') {
                            // 1. Idempotency Check: Check if we already processed this specific trigger logic
                            // (We use a simple field check for now, but in future should store tx hash)
                            if (position.exitTxHash === `trigger_${tx.lt}`) {
                                Logger.warn(logCtx, `DUPLICATE_TRIGGER_IGNORED: ${tx.lt}`, position.id);
                                continue;
                            }

                            // 2. Loop guard: update status to exit_monitoring
                            await prisma.position.update({ 
                                where: { id: position.id }, 
                                data: { 
                                    status: 'exit_monitoring',
                                    exitTxHash: `trigger_${tx.lt}` // Mark as processed with this specific trigger
                                } 
                            });
                            
                            // Re-fetch position not needed as forceVaultExit takes ID
                            // Pass override status implicitly via ID lookups in ExecutionService (we just enabled it)
                            await ExecutionService.forceVaultExit(position.id, vaultAddr, userWallet);
                            triggeredCount++;
                        } else {
                            Logger.info(logCtx, `Position ${position.id} already CLOSED. Skipping.`);
                        }
                    } catch (err) {
                        Logger.error(logCtx, 'REFUND_TRIGGER_FAILED', position.id, { error: String(err) });
                        
                        // CRITICAL: Do NOT revert status here. 
                        // If it fails, we want it explicitly STUCK in 'exit_monitoring' rather than looping.
                        // Operator intervention required.
                    }
                }
            }
        }

        return { status: 'success', checked: transactions.length, triggered: triggeredCount };

    } catch (error) {
        Logger.error(logCtx, 'CRITICAL_FAILURE', job.id ? String(job.id) : undefined, { error: String(error) });
        throw error;
    }
};
