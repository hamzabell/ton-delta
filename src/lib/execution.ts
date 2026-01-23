import { prisma } from './prisma';
import { buildAtomicExitTx } from './fees';
import { sendTransactions$ } from './custodialWallet';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../services/logger';
import { buildClosePositionPayload, buildOpenPositionPayload } from './storm';
import { stonfi } from './stonfi';
import { Buffer } from 'buffer';
import { wrapWithKeeperRequest } from './w5-utils';
import { Address, Cell, toNano } from '@ton/core';

/**
 * Service to handle actual on-chain execution of critical strategy actions.
 * Centralizes "Exit" logic so it can be called by both Strategy Job (Expiry) and Risk Job (Max Loss).
 */
export const ExecutionService = {

    /**
     * Executes the initial entry (Spot + Short) for a new position.
     * Assumes Vault is deployed and funded with TON.
     */
    enterInitialPosition: async (positionId: string) => {
        Logger.info('ExecutionService', 'Executing INITIAL_ENTRY...', positionId);

        try {
            const position = await prisma.position.findUnique({ where: { id: positionId }, include: { user: true } });
            if (!position) throw new Error("Position not found");

            // Verify Contract Deployment
            const { checkContractDeployed } = await import('./w5-utils');
            const targetVault = position.vaultAddress || position.user.walletAddress!;
            const isDeployed = await checkContractDeployed(targetVault);
            
            if (!isDeployed) {
                Logger.warn('ExecutionService', 'Vault not deployed yet. Skipping entry.', positionId);
                throw new Error("Vault not deployed");
            }

            // Strategy: 50% Spot, 50% Margin (1x Short)
            const capital = position.totalEquity;
            const spotAlloc = capital * 0.5;
            const marginAlloc = capital * 0.5;

            const ticker = position.pairId.split('-')[0].toUpperCase();

            // 1. Swap 50% TON -> Spot
            const buySpotTx = await stonfi.buildSwapTx({
                 userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                 fromToken: 'TON', 
                 toToken: ticker, 
                 amount: toNano(spotAlloc.toFixed(2)).toString(), 
                 minOutput: '1' 
            });

            // 2. Open Short with remaining 50%
            const openShortTx = await buildOpenPositionPayload({
                 vaultAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                 amount: marginAlloc.toFixed(2),
                 leverage: 1
            });

            // 3. Wrap & Broadcast
             const rawMessages = [
                 { to: Address.parse(buySpotTx.to), value: typeof buySpotTx.value === 'bigint' ? buySpotTx.value : BigInt(buySpotTx.value), body: typeof buySpotTx.body === 'string' ? Cell.fromBase64(buySpotTx.body) : buySpotTx.body },
                 { to: Address.parse(openShortTx.to), value: BigInt(openShortTx.value), body: openShortTx.body ? Cell.fromBase64(openShortTx.body) : undefined }
             ];

             const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
             const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

             const txs = [{
                address: targetAddress.toString(),
                value: '50000000', 
                cell: wrappedCell.toBoc().toString('base64')
             }];

             const result = await firstValueFrom(sendTransactions$(txs));

             await prisma.position.update({ 
                 where: { id: positionId }, 
                 data: { 
                     status: 'active',
                     spotAmount: spotAlloc, 
                     perpAmount: marginAlloc
                 } 
             });
             
             Logger.info('ExecutionService', 'INITIAL_ENTRY_EXECUTED', positionId, { seqno: result.seqno });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'INITIAL_ENTRY_FAILED', positionId, { error: err.message });
             throw err;
        }
    },

    /**
     * Executes a Panic Unwind for a given Position.
     */
    executePanicUnwind: async (positionId: string, reason: string) => {
        Logger.info('ExecutionService', `Initiating Panic Unwind. Reason: ${reason}`, positionId);

        try {
            const position = await prisma.position.findUnique({
                where: { id: positionId },
                include: { user: true }
            });

            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            const entryValue = position.spotAmount * position.entryPrice;
            const currentEquity = position.totalEquity || entryValue * 0.9; 

            // 1. Build Liquidation Payloads based on Status
            const liquidationMessages: { to: Address, value: bigint, body?: Cell }[] = [];

            if (position.status === 'active') {
                // A. Active Basis Trade -> Close Short + Sell Spot
                Logger.info('ExecutionService', 'Panic Unwind: Liquidating Active Position...', positionId);
                
                const closeShortTx = await buildClosePositionPayload({
                     vaultAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                     positionId: position.id 
                });

                const ticker = position.pairId.split('-')[0].toUpperCase();
                const sellSpotTx = await stonfi.buildSwapTx({
                     userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                     fromToken: ticker, 
                     toToken: 'TON',
                     amount: position.spotAmount.toString(),
                     minOutput: '1'
                });

                liquidationMessages.push(
                    { to: Address.parse(closeShortTx.to), value: BigInt(closeShortTx.value), body: closeShortTx.body ? Cell.fromBase64(closeShortTx.body) : undefined },
                    { to: Address.parse(sellSpotTx.to), value: typeof sellSpotTx.value === 'bigint' ? sellSpotTx.value : BigInt(sellSpotTx.value), body: typeof sellSpotTx.body === 'string' ? Cell.fromBase64(sellSpotTx.body) : sellSpotTx.body }
                );

            } else if (position.status === 'stasis' || position.status === 'stasis_pending_stake') {
                // B. Cash Stasis -> Already Cash
                Logger.info('ExecutionService', 'Panic Unwind: Position is in Cash Stasis. Skipping liquidation.', positionId);

            } else if (position.status === 'stasis_active') {
                // C. Yield Hunter (Liquid Staking) -> Sell tsTON
                Logger.info('ExecutionService', 'Panic Unwind: Selling Liquid Staking position...', positionId);
                
                // We assume the asset is tsTON.
                const sellTsTonTx = await stonfi.buildSwapTx({
                     userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                     fromToken: 'tsTON', 
                     toToken: 'TON',
                     amount: toNano(position.totalEquity.toString()).toString(), 
                     minOutput: '1'
                });

                liquidationMessages.push(
                    { to: Address.parse(sellTsTonTx.to), value: typeof sellTsTonTx.value === 'bigint' ? sellTsTonTx.value : BigInt(sellTsTonTx.value), body: typeof sellTsTonTx.body === 'string' ? Cell.fromBase64(sellTsTonTx.body) : sellTsTonTx.body }
                );
            }



            
            Logger.info('ExecutionService', 'Wrapping for W5 delegation, revocation, and sweep...', positionId);
            const keeperAddress = Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS || "");
            const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
            
            // Keeper sends TX to Unwind AND Remove Itself (Atomic Safety)
            // 2. Build Exit Transfers (Fee + Sweep to User)
             const { messages: exitMessages, summary } = buildAtomicExitTx({
                 userAddress: position.user.walletAddress || '',
                 totalAmountTon: currentEquity / (position.currentPrice || 1), 
                 entryValueTon: entryValue / (position.entryPrice || 1)
            });

            Logger.info('ExecutionService', 'Generated Panic Payloads', positionId, summary);

            // 3. Combine & Configure Modes
            const rawMessages = [
                ...liquidationMessages,
                // Exit Transfers (Fee & Sweep)
                ...exitMessages.map(msg => {
                    const isUserCalc = msg.to.toString() === Address.parse(position.user.walletAddress!).toString();
                    return {
                        to: msg.to,
                        value: isUserCalc ? BigInt(0) : msg.value, // User gets remaining balance
                        body: msg.body,
                        mode: isUserCalc ? 128 : 1 // 128 = CARRY_ALL, 1 = PAY_FEES_SEPARATELY
                    };
                })
            ];
            

            
            // Keeper sends TX to Unwind AND Remove Itself (Atomic Safety)
            // Note: wrapWithKeeperRequest takes 'userAddress' to build the dummy instance.
            // Ideally this should matches the Vault's expect configuration.
            // Since User owns Vault, and Vault is W5, this is correct.
            const wrappedCell = await wrapWithKeeperRequest(
                targetAddress, 
                rawMessages,
                keeperAddress // Revoke this keeper
            );

            // The Keeper sends ONE transaction: To Vault (or User), Body = Wrapped Request
            const txs = [{
                address: targetAddress.toString(),
                value: '50000000', // 0.05 TON for gas
                cell: wrappedCell.toBoc().toString('base64')
            }];

            Logger.info('ExecutionService', 'Broadcasting Relayed Transaction...', positionId);
            
            const result = await firstValueFrom(sendTransactions$(txs));
            const txHash = `seqno_${result.seqno}`; 

            await prisma.$transaction([
                prisma.position.update({
                    where: { id: positionId },
                    data: { status: 'closed' }
                }),
            ]);

            Logger.warn('ExecutionService', 'PANIC_UNWIND_EXECUTED', positionId, {
                reason,
                txHash,
                feeSummary: summary,
                liquidation: 'Short Closed + Spot Sold',
                seqno: result.seqno
            });

            return txHash;

        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            Logger.error('ExecutionService', 'EXECUTION_FAILURE', positionId, { error: err.message, stack: err.stack });
            throw err;
        }
    },

    /**
     * Transitions a position from Active -> Stasis
     */
    enterStasis: async (positionId: string) => {
        Logger.info('ExecutionService', 'Executing ENTER_STASIS...', positionId);
        
        try {
             const position = await prisma.position.findUnique({ where: { id: positionId }, include: { user: true } });
             if (!position) throw new Error("Position not found");

             // 1. Build Close Short Payload
             const closeShortTx = await buildClosePositionPayload({
                 vaultAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Should be dynamic
                 positionId: position.id 
             });

             // 2. Build Spot Sell Payload (Liquidation to Cash)
             // We assume pairId format "ticker-ton" implies ticker is the spot asset.
             // e.g. "dogs-ton" -> Spot is DOGS. We swap DOGS -> TON.
             const ticker = position.pairId.split('-')[0].toUpperCase();
             const sellSpotTx = await stonfi.buildSwapTx({
                 userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                 fromToken: ticker, 
                 toToken: 'TON',
                 amount: position.spotAmount.toString(),
                 minOutput: '1'
             });

             // 3. Wrap & Broadcast
             const rawMessages = [
                 { to: Address.parse(closeShortTx.to), value: BigInt(closeShortTx.value), body: closeShortTx.body ? Cell.fromBase64(closeShortTx.body) : undefined },
                 { to: Address.parse(sellSpotTx.to), value: typeof sellSpotTx.value === 'bigint' ? sellSpotTx.value : BigInt(sellSpotTx.value), body: typeof sellSpotTx.body === 'string' ? Cell.fromBase64(sellSpotTx.body) : sellSpotTx.body }
             ];

             const targetAddress = position.vaultAddress 
                ? Address.parse(position.vaultAddress) 
                : Address.parse(position.user.walletAddress!);

             const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

             const txs = [{
                address: targetAddress.toString(),
                value: '50000000', // 0.05 TON
                cell: wrappedCell.toBoc().toString('base64')
             }];

             const result = await firstValueFrom(sendTransactions$(txs));

             const newStatus = position.stasisPreference === 'STAKE' ? 'stasis_pending_stake' : 'stasis';
             await prisma.position.update({ where: { id: positionId }, data: { status: newStatus } });
             
             Logger.info('ExecutionService', 'STASIS_MODE_ACTIVATED', positionId, { seqno: result.seqno, mode: newStatus });
             
             if (newStatus === 'stasis_pending_stake') {
                 Logger.info('ExecutionService', 'Yield Hunter: Queued for Liquid Staking (Next Job Cycle)', positionId);
             }

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'ENTER_STASIS_FAILED', positionId, { error: err.message });
             throw err;
        }
    },

    /**
     * Yield Hunter: Executes Step 2 (Liquid Stake TON -> tsTON)
     */
    processPendingStake: async (positionId: string) => {
        Logger.info('ExecutionService', 'Executing STAKE_TON (Yield Hunter)', positionId);

        try {
            const position = await prisma.position.findUnique({ where: { id: positionId }, include: { user: true } });
            if (!position) throw new Error("Position not found");

            // Build Swap: TON -> tsTON
            // We blindly swap 99% of available TON to tsTON, leaving gas.
            // Since we don't track balance in DB in real-time, we assume Full Balance for this step.
            // Note: In prod, query vault balance first.
            const stakeTx = await stonfi.buildSwapTx({
                 userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                 fromToken: 'TON', 
                 toToken: 'tsTON',
                 amount: toNano((position.totalEquity * 0.99).toFixed(2)).toString(), // Estimate
                 minOutput: '1'
            });

            // Wrap & Broadcast
            const rawMessages = [
                 { to: Address.parse(stakeTx.to), value: typeof stakeTx.value === 'bigint' ? stakeTx.value : BigInt(stakeTx.value), body: typeof stakeTx.body === 'string' ? Cell.fromBase64(stakeTx.body) : stakeTx.body }
            ];

            const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
            const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

            const txs = [{
                address: targetAddress.toString(),
                value: '50000000', 
                cell: wrappedCell.toBoc().toString('base64')
            }];

            const result = await firstValueFrom(sendTransactions$(txs));

            await prisma.position.update({ where: { id: positionId }, data: { status: 'stasis_active' } });
            Logger.info('ExecutionService', 'YIELD_HUNTER_ACTIVE', positionId, { seqno: result.seqno });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'STAKE_FAILED', positionId, { error: err.message });
             throw err;
        }
    },

    /**
     * Transitions a position from Stasis -> Active
     */
    exitStasis: async (positionId: string) => {
        Logger.info('ExecutionService', 'Executing EXIT_STASIS...', positionId);
        
        try {
             const position = await prisma.position.findUnique({ where: { id: positionId }, include: { user: true } });
             if (!position) throw new Error("Position not found");

             const messages: any[] = [];

             // 1. If Liquid Staking (Yield Hunter), sell tsTON -> TON first
             if (position.status === 'stasis_active') {
                 Logger.info('ExecutionService', 'Exit Stasis: Unstaking tsTON -> TON...', positionId);
                 const unstakeTx = await stonfi.buildSwapTx({
                     userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                     fromToken: 'tsTON', 
                     toToken: 'TON',
                     amount: toNano(position.totalEquity.toString()).toString(), // Proxy for balance
                     minOutput: '1'
                 });
                 messages.push({ to: Address.parse(unstakeTx.to), value: typeof unstakeTx.value === 'bigint' ? unstakeTx.value : BigInt(unstakeTx.value), body: typeof unstakeTx.body === 'string' ? Cell.fromBase64(unstakeTx.body) : unstakeTx.body });
             }

             // 2. Re-Enter Spot (Buy DOGS with TON)
             // Note: If we just unstaked, these messages will be chained in the same block.
             // Ideally we should use forwardPayload or separate transactions, but for atomic simplicity we try parallel valid messages.
             // Warning: If Unstake hasn't settled, Buy Spot might fail if balance is insufficient. 
             // Ideally this should be 2 steps. But for now, we assume we have enough "gas" or balance overlaps.
             // OR: A better approach for `stasis_active` -> `active` is to just Unstake, set status to `stasis`, and let next job cycle handle `stasis` -> `active`.
             // Doing it in 2 steps is safer.
             
             if (position.status === 'stasis_active') {
                 // ONLY UNSTAKE for this cycle.
                 const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
                 const wrappedCell = await wrapWithKeeperRequest(targetAddress, messages);
                 const txs = [{ address: targetAddress.toString(), value: '50000000', cell: wrappedCell.toBoc().toString('base64') }];
                 const result = await firstValueFrom(sendTransactions$(txs));
                 
                 // Update to 'stasis' so next cycle picks it up for Spot Entry
                 await prisma.position.update({ where: { id: positionId }, data: { status: 'stasis' } });
                 Logger.info('ExecutionService', 'EXIT_STASIS_STEP_1_COMPLETE', positionId, { seqno: result.seqno });
                 return;
             }

             // --- Standard Stasis (Cash) Exit Logic below ---

             const ticker = position.pairId.split('-')[0].toUpperCase();
             const amountToSwap = position.spotValue || 100; 
             
             const buySpotTx = await stonfi.buildSwapTx({
                 userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                 fromToken: 'TON',
                 toToken: ticker, 
                 amount: toNano(amountToSwap.toString()).toString(), 
                 minOutput: '1' 
             });

             const amountForMargin = position.perpValue || 100;
             const openShortTx = await buildOpenPositionPayload({
                 vaultAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                 amount: amountForMargin.toString(),
                 leverage: 1
             });

             messages.push(
                 { to: Address.parse(buySpotTx.to), value: typeof buySpotTx.value === 'bigint' ? buySpotTx.value : BigInt(buySpotTx.value), body: typeof buySpotTx.body === 'string' ? Cell.fromBase64(buySpotTx.body) : buySpotTx.body },
                 { to: Address.parse(openShortTx.to), value: BigInt(openShortTx.value), body: openShortTx.body ? Cell.fromBase64(openShortTx.body) : undefined }
             );

             const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
             const wrappedCell = await wrapWithKeeperRequest(targetAddress, messages);

             const txs = [{
                address: targetAddress.toString(),
                value: '50000000', 
                cell: wrappedCell.toBoc().toString('base64')
             }];

             const result = await firstValueFrom(sendTransactions$(txs));

             await prisma.position.update({ where: { id: positionId }, data: { status: 'active' } });
             Logger.info('ExecutionService', 'STASIS_MODE_EXITED', positionId, { seqno: result.seqno });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'EXIT_STASIS_FAILED', positionId, { error: err.message });
             throw err;
        }
    },


    /**
     * Rebalances the position by moving funds between Spot and Perp Collateral
     */
    rebalancePosition: async (positionId: string, amount: number, isDeposit: boolean) => {
        Logger.info('ExecutionService', `Executing REBALANCE (Deposit: ${isDeposit}, Amount: ${amount})`, positionId);

        try {
            const position = await prisma.position.findUnique({ where: { id: positionId }, include: { user: true } });
            if (!position) throw new Error("Position not found");

            const { buildAdjustMarginPayload } = await import('./storm');

            // 1. Build Rebalance Payload
            const rebalanceTx = await buildAdjustMarginPayload({
                vaultAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                amount: amount.toFixed(2),
                isDeposit
            });

            // 2. Wrap & Broadcast
            const rawMessages = [
                { to: Address.parse(rebalanceTx.to), value: BigInt(rebalanceTx.value), body: rebalanceTx.body ? Cell.fromBase64(rebalanceTx.body) : undefined }
            ];

            const targetAddress = position.vaultAddress 
               ? Address.parse(position.vaultAddress) 
               : Address.parse(position.user.walletAddress!);

            const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

            const txs = [{
               address: targetAddress.toString(),
               value: '50000000', 
               cell: wrappedCell.toBoc().toString('base64')
            }];

            const result = await firstValueFrom(sendTransactions$(txs));
            
            // Log for Audit
            await prisma.auditLog.create({
                data: {
                    level: 'INFO',
                    component: 'Execution',
                    action: 'REBALANCE_EXECUTED',
                    positionId,
                    details: { amount, isDeposit, txHash: `seqno_${result.seqno}` }
                }
            });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'REBALANCE_FAILED', positionId, { error: err.message });
             throw err;
        }
    },

    /**
     * Fixes Delta Drift by adjusting the Short position size to match Spot.
     */
    rebalanceDelta: async (positionId: string, delta: number) => {
        Logger.info('ExecutionService', `Executing DELTA_REBALANCE (Delta: ${delta})`, positionId);

        try {
            const position = await prisma.position.findUnique({ where: { id: positionId }, include: { user: true } });
            if (!position) throw new Error("Position not found");

            let txPayload;
            const absDelta = Math.abs(delta);

            if (delta > 0) {
                // Short is too small (Under-hedged). Open more Short.
                 txPayload = await buildOpenPositionPayload({
                     vaultAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                     amount: absDelta.toFixed(2),
                     leverage: 1
                });
            } else {
                // Short is too big (Over-hedged). Close some Short.
                // Note: buildClosePositionPayload currently closes FULL position in our mock. 
                // We'll assume for now it handles partials or we just close full and re-open (inefficient).
                // For MVP, we'll try to use the same payload, assuming the backend supports partials via 'amount' arg if we added it.
                // Refactoring: The mock buildClosePositionPayload doesn't take amount.
                // So we'll skip partial close for now and just log warning if delta is small
                if (Math.abs(delta) < 10) { 
                    Logger.info('ExecutionService', 'Skipping small partial close rebalance', positionId);
                    return; 
                }
                
                // Fallback: If heavy drift, Close Full
                 txPayload = await buildClosePositionPayload({
                     vaultAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                     positionId: position.id
                });
            }

            // Wrap & Broadcast
             const rawMessages = [
                 { to: Address.parse(txPayload.to), value: BigInt(txPayload.value), body: txPayload.body ? Cell.fromBase64(txPayload.body) : undefined }
             ];

             const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
             const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

             const txs = [{
                address: targetAddress.toString(),
                value: '50000000', 
                cell: wrappedCell.toBoc().toString('base64')
             }];

             const result = await firstValueFrom(sendTransactions$(txs));

             // Update DB
             const change = delta > 0 ? absDelta : -absDelta;
             await prisma.position.update({ 
                 where: { id: positionId }, 
                 data: { perpAmount: { increment: change } } 
             });

             Logger.info('ExecutionService', 'DELTA_REBALANCE_EXECUTED', positionId, { seqno: result.seqno });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'DELTA_REBALANCE_FAILED', positionId, { error: err.message });
             throw err;
        }
    }
};
