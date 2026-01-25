/* eslint-disable */
import { prisma } from './prisma';
import { buildAtomicExitTx } from './fees';
import { sendTransactions$ } from './custodialWallet';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../services/logger';
import { buildClosePositionPayload, buildOpenPositionPayload } from './storm';
import { stonfi } from './stonfi';
import { Buffer } from 'buffer';
import { wrapWithKeeperRequest } from './w5-utils';
import { Address, Cell, toNano, fromNano, beginCell } from '@ton/core';
import { getTonBalance } from './onChain';
import { swapcoffee } from './swapcoffee';

/**
 * Service to handle actual on-chain execution of critical strategy actions.
 * Centralizes "Exit" logic so it can be called by both Strategy Job (Expiry) and Risk Job (Max Loss).
 */
export const ExecutionService = {

    /**
     * Checks if the Vault has enough solvent funds.
     * If insolvent, it AUTOMATICALLY triggers 'Enter Stasis' to secure funds.
     */
    ensureSolvencyOrStasis: async (positionId: string, vaultAddress: string, currentActionCost: number, actionName: string) => {
        try {
            const balanceNano = await getTonBalance(vaultAddress);
            const balanceTON = Number(fromNano(balanceNano));

            // Required: Stasis Cost (0.05) + Current Action + Small Buffer (0.05)
            const STASIS_RESERVE = 0.05;
            const BUFFER = 0.05;
            const requiredParam = STASIS_RESERVE + currentActionCost + BUFFER;

            Logger.info('ExecutionService', 'SOLVENCY_CHECK', positionId, { 
                action: actionName,
                balance: balanceTON,
                required: requiredParam
            });

            if (balanceTON < requiredParam) {
                Logger.warn('ExecutionService', `SOLVENCY_FAILURE: Vault balance (${balanceTON}) < Required (${requiredParam}). Triggering Stasis Mode.`, positionId);
                
                // Trigger Stasis immediately instead of Panic
                await ExecutionService.enterStasis(positionId);
                
                // Throw specific error to halt the original action
                throw new Error(`SOLVENCY_STASIS_TRIGGERED: Vault had insufficient funds for ${actionName}. Moved to Stasis.`);
            }

            return true;
        } catch (e) {
            // If it's our own stasis trigger, rethrow it.
            if ((e as Error).message.includes('SOLVENCY_STASIS_TRIGGERED')) throw e;
            throw e;
        }
    },

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
            // NON-MOCK: Fetch actual on-chain balance
            const vaultAddrStr = position.vaultAddress || position.user.walletAddress!;
            const balanceNano = await getTonBalance(vaultAddrStr);
            const balance = Number(fromNano(balanceNano));
            
            // Safety & Fee Calculation
            // 1. Gas Buffer (Standard): 0.1 TON (kept for compute/storage)
            // Fees Removed: No Entry Fee, No Exit Insurance.
            const GAS_BUFFER = 0.1;
            
            const totalReserved = GAS_BUFFER;

            if (balance < totalReserved) {
                 throw new Error(`Insufficient Vault Balance: Has ${balance} TON, Need ${totalReserved} TON`);
            }
            
            // The "Investable" amount is what remains after reserving buffer
            const investableAmount = balance - totalReserved;

            const spotAlloc = investableAmount * 0.5;
            const marginAlloc = investableAmount * 0.5;

            const ticker = position.pairId.split('-')[0].toUpperCase();

            // 1. Swap 50% TON -> Spot
            const buySpotTx = await stonfi.buildSwapTx({
                 userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                 fromToken: 'TON', 
                 toToken: ticker, 
                 amount: spotAlloc.toFixed(2), 
            });

            // 2. Open Short with remaining 50%
            const openShortTx = await buildOpenPositionPayload({
                 vaultAddress: position.vaultAddress || position.user.walletAddress!, // Use actual vault
                 amount: marginAlloc.toFixed(2),
                 leverage: 1,
                 symbol: ticker
            });

             // 3. Wrap & Broadcast
             const rawMessages = [
                 { to: Address.parse(buySpotTx.to), value: typeof buySpotTx.value === 'bigint' ? buySpotTx.value : BigInt(buySpotTx.value), body: typeof buySpotTx.body === 'string' ? Cell.fromBase64(buySpotTx.body) : buySpotTx.body },
                 { to: Address.parse(openShortTx.to), value: BigInt(openShortTx.value), body: openShortTx.body ? Cell.fromBase64(openShortTx.body) : undefined },
                 // FEE REFUND: Vault -> Keeper (0.05 TON)
                 {
                    to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!),
                    value: toNano('0.05'),
                    body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Entry').endCell()
                 }
             ];

             // REMOVED: Keeper Entry Fee / Top Up. User pays entry gas.

             const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
             const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

             const txs = [{
                address: targetAddress.toString(),
                value: '50000000', 
                cell: wrappedCell.toBoc().toString('base64')
             },
             // FEE REFUND: Keeper -> User (0.03 TON)
             {
                address: position.user.walletAddress || position.userId,
                value: '30000000', // 0.03 TON
                cell: beginCell().storeUint(0, 32).storeStringTail("Pamelo: Entry Refund").endCell().toBoc().toString('base64')
             }];

             const result = await firstValueFrom(sendTransactions$(txs));

             // Use the seqno as a temporary entryTxHash until it's confirmed
             // Real hash would require parsing the message cell, but we'll use this for tracking.
             const entryTxHash = `entry_seq_${result.seqno}_${Date.now()}`;

             await prisma.position.update({ 
                 where: { id: positionId }, 
                 data: { 
                     status: 'pending_entry_verification',
                     entryTxHash: entryTxHash,
                     spotAmount: spotAlloc, 
                     perpAmount: marginAlloc
                 } 
             });
             
             Logger.info('ExecutionService', 'INITIAL_ENTRY_BROADCASTED', positionId, { entryTxHash, seqno: result.seqno });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'INITIAL_ENTRY_FAILED', positionId, { error: err.message });
             throw err;
        }
    },

    /**
     * Builds the Exit Payload for a given Position.
     * This allows the USER to sign and execute the exit.
     */
    buildUserExitPayload: async (positionId: string, reason: string, destinationAddress?: string) => {
        Logger.info('ExecutionService', `Building User Exit Payload. Reason: ${reason}`, positionId);

        try {
            // NOTE: We don't update status to 'processing_exit' here anymore because this is a read-only operation
            // that generates a payload. The API handler will update the status.

            const position = await prisma.position.findUnique({
                where: { id: positionId },
                include: { user: true }
            });

            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            const userWalletAddr = position.user.walletAddress || position.userId;
            if (!userWalletAddr) {
                throw new Error(`User wallet address is missing for position ${positionId}`);
            }

            const vaultOrWalletAddr = position.vaultAddress || userWalletAddr;
            const entryValue = position.spotAmount * position.entryPrice;
            
            // Helper function for safe address parsing
            const safeParseAddress = (addr: string | undefined, context: string) => {
                if (!addr) throw new Error(`Address is missing for ${context}`);
                try {
                    return Address.parse(addr);
                } catch (e) {
                    Logger.error('ExecutionService', 'ADDRESS_PARSE_FAILED', positionId, { address: addr, context });
                    throw new Error(`Invalid address for ${context}: ${addr}`);
                }
            };

            // 1. Build Liquidation Payloads
            const liquidationMessages: { to: Address, value: bigint, body?: Cell }[] = [];
            
            if (position.status === 'stasis') {
                Logger.info('ExecutionService', `[CASH STASIS] Position in Stasis. Direct refund.`, positionId);
            }
            else if (position.status === 'active' || position.status === 'stasis_active') { // Handle stasis_active too just in case
                const ticker = position.pairId.split('-')[0].toUpperCase();
                
                // Step 1: Close Short
                try {
                    const closeShortTx = await buildClosePositionPayload({
                         vaultAddress: vaultOrWalletAddr,
                         positionId: position.id,
                         symbol: ticker
                    });
                    
                    if (closeShortTx) {
                        liquidationMessages.push({ 
                            to: safeParseAddress(closeShortTx.to, 'closeShortTx.to'), 
                            value: BigInt(closeShortTx.value || 0), 
                            body: closeShortTx.body ? Cell.fromBase64(closeShortTx.body) : undefined 
                        });
                    }
                } catch (e) {
                    Logger.warn('ExecutionService', `[EXIT] Could not build close short (likely closed).`, positionId);
                }

                // Step 2: Sell Spot
                try {
                    const quote = await swapcoffee.getQuote(
                        ticker,
                        'TON',
                        toNano(position.spotAmount.toString()).toString()
                    );
                    const expectedOutput = quote.to_amount || '0';
                    const minOut = (BigInt(expectedOutput) * BigInt(95)) / BigInt(100);

                    const sellSpotTx = await swapcoffee.buildSwapTx({
                         userWalletAddress: vaultOrWalletAddr,
                         fromToken: ticker, 
                         toToken: 'TON',
                         amount: position.spotAmount.toString(),
                         minOutput: minOut.toString()
                    });

                    liquidationMessages.push({ 
                        to: safeParseAddress(sellSpotTx.to, 'sellSpotTx.to'), 
                        value: typeof sellSpotTx.value === 'bigint' ? sellSpotTx.value : BigInt(sellSpotTx.value), 
                        body: typeof sellSpotTx.body === 'string' ? Cell.fromBase64(sellSpotTx.body) : sellSpotTx.body 
                    });
                } catch (e) {
                     Logger.warn('ExecutionService', `[EXIT] Could not build spot sell.`, positionId);
                }
            }

            // 2. Prepare Exit Messages
            // We can't know the exact vault balance at execution time, but we can instruct the vault
            // to sweep everything using mode 128.
            
            const keeperAddress = safeParseAddress(process.env.NEXT_PUBLIC_KEEPER_ADDRESS, 'NEXT_PUBLIC_KEEPER_ADDRESS');
            const targetAddress = position.vaultAddress ? safeParseAddress(position.vaultAddress, 'position.vaultAddress') : safeParseAddress(userWalletAddr, 'userWalletAddr');

            // Fee Logic (from fees.ts) - we call it assuming full sweep
            // Since we use mode 128, the value/amount in the final message is ignored (it sends all)
            // But we can structure the messages to pay the fee (if any) first.
            
            const { messages: exitMessages } = buildAtomicExitTx({
                 userAddress: destinationAddress || userWalletAddr,
                 totalAmountTon: 0, // Placeholder, loop will handle mode 128
                 entryValueTon: entryValue 
            });

            // 3. Assemble
            const rawMessages = [
                // Refund Keeper for any outstanding (optional, maybe skip for user exit?)
                // Actually, let's skip checking Keeper refund for user exit to maximize user return.
                // The Keeper gets refunded per-action anyway.
                
                ...liquidationMessages,
                
                ...exitMessages.map((msg, index) => {
                    return {
                        to: msg.to,
                        value: msg.value, // value is relevant for fee, but for user sweep we want mode 128 on last
                        body: msg.body,
                        mode: index === exitMessages.length - 1 ? 128 : 1 // 128 for last (sweep), 1 for fee (pay separate)
                    };
                })
            ];
            
            // 4. Wrap with Owner Request (Internal Message)
            // The User (Owner) signs this payload and sends it to the Vault.
            // Opcode: 0x706c7573 ('plus')
            
            // Note: We do NOT include the keeper refund here directly because the User pays gas.
            // If we want to revoke the keeper, we can add a removeExtension action, but 
            // for a full exit (sweep), the account is effectively emptied. 
            // Revocation is safer done via separate admin tool if needed, 
            // or we could add it here if `wrapWithOwnerRequest` supported extension removal args.
            // For now, let's just execute the sweep.

            const { wrapWithOwnerRequest } = await import('./w5-utils');
            const wrappedCell = await wrapWithOwnerRequest(rawMessages);

            return {
                payload: wrappedCell.toBoc().toString('base64'),
                destination: targetAddress.toString()
            };

        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            Logger.error('ExecutionService', 'BUILD_EXIT_PAYLOAD_FAILED', positionId, { error: err.message });
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

             const ticker = position.pairId.split('-')[0].toUpperCase();

             // 1. Build Close Short Payload
             const closeShortTx = await buildClosePositionPayload({
                 vaultAddress: position.vaultAddress || position.user.walletAddress!, 
                 positionId: position.id,
                 symbol: ticker
             });

             // 2. Build Spot Sell Payload (Liquidation to Cash)
             // We assume pairId format "ticker-ton" implies ticker is the spot asset.
             // e.g. "dogs-ton" -> Spot is DOGS. We swap DOGS -> TON.
             const sellSpotTx = await swapcoffee.buildSwapTx({
                 userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                 fromToken: ticker, 
                 toToken: 'TON',
                 amount: position.spotAmount.toString(),
                 minOutput: '1'
             });

             // 0. Safety Check
             const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
             await ExecutionService.ensureSolvencyOrStasis(positionId, targetAddress.toString(), 0.05, 'ENTER_STASIS');


            const keeperRefundMsg = {
                 to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!),
                 value: toNano('0.05'),
                 body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Enter Stasis').endCell()
            };

             // 3. Wrap & Broadcast
             const rawMessages = [
                 keeperRefundMsg,
                 { to: Address.parse(closeShortTx?.to || 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'), value: BigInt(closeShortTx?.value || 0), body: closeShortTx?.body ? Cell.fromBase64(closeShortTx.body) : undefined },
                 { to: Address.parse(sellSpotTx.to), value: typeof sellSpotTx.value === 'bigint' ? sellSpotTx.value : BigInt(sellSpotTx.value), body: typeof sellSpotTx.body === 'string' ? Cell.fromBase64(sellSpotTx.body) : sellSpotTx.body }
             ];

             const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

             const txs = [{
                address: targetAddress.toString(),
                value: '50000000', // 0.05 TON
                cell: wrappedCell.toBoc().toString('base64')
             }];

             const result = await firstValueFrom(sendTransactions$(txs));

             await prisma.position.update({ where: { id: positionId }, data: { status: 'stasis' } });
             
             Logger.info('ExecutionService', 'STASIS_MODE_ACTIVATED', positionId, { seqno: result.seqno, mode: 'stasis' });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'ENTER_STASIS_FAILED', positionId, { error: err.message });
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


             // --- Standard Stasis (Cash) Exit Logic below ---

             const ticker = position.pairId.split('-')[0].toUpperCase();
             const amountToSwap = position.spotValue || 100; 
             
             const buySpotTx = await swapcoffee.buildSwapTx({
                 userWalletAddress: position.vaultAddress || position.user.walletAddress!,
                 fromToken: 'TON',
                 toToken: ticker, 
                 amount: toNano(amountToSwap.toString()).toString(), 
                 minOutput: '1' 
             });

             const amountForMargin = position.perpValue || 100;
             const openShortTx = await buildOpenPositionPayload({
                 vaultAddress: position.vaultAddress || position.user.walletAddress!,
                 amount: amountForMargin.toString(),
                 leverage: 1
             });

             // 0. Safety Check
             const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);
             await ExecutionService.ensureSolvencyOrStasis(positionId, targetAddress.toString(), 0.05, 'EXIT_STASIS');

             const keeperRefundMsg = {
                  to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!),
                  value: toNano('0.05'),
                  body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Exit Stasis').endCell()
             };

             messages.push(
                 keeperRefundMsg,
                 { to: Address.parse(buySpotTx.to), value: typeof buySpotTx.value === 'bigint' ? buySpotTx.value : BigInt(buySpotTx.value), body: typeof buySpotTx.body === 'string' ? Cell.fromBase64(buySpotTx.body) : buySpotTx.body },
                 { to: Address.parse(openShortTx.to), value: BigInt(openShortTx.value), body: openShortTx.body ? Cell.fromBase64(openShortTx.body) : undefined }
             );

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

            const ticker = position.pairId.split('-')[0].toUpperCase();

            // 1. Build Rebalance Payload
            const rebalanceTx = await buildAdjustMarginPayload({
                vaultAddress: position.vaultAddress || position.user.walletAddress!,
                amount: amount.toFixed(2),
                isDeposit,
                symbol: ticker
            });

            const targetAddress = position.vaultAddress 
               ? Address.parse(position.vaultAddress) 
               : Address.parse(position.user.walletAddress!);

            // 0. Safety Check
            await ExecutionService.ensureSolvencyOrStasis(positionId, targetAddress.toString(), 0.05, 'REBALANCE_POSITION');

            const keeperRefundMsg = {
                to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!),
                value: toNano('0.05'),
                body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Rebalance').endCell()
            };

            // 2. Wrap & Broadcast
            const rawMessages = [
                keeperRefundMsg,
                { to: Address.parse(rebalanceTx.to), value: BigInt(rebalanceTx.value), body: rebalanceTx.body ? Cell.fromBase64(rebalanceTx.body) : undefined }
            ];

            const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

            const txs = [{
               address: targetAddress.toString(),
               value: '50000000', 
               cell: wrappedCell.toBoc().toString('base64')
            }];

            const result = await firstValueFrom(sendTransactions$(txs));
            
             // Log for Audit
            Logger.info('Execution', 'REBALANCE_EXECUTED', positionId, { amount, isDeposit, txHash: `seqno_${result.seqno}` });
        
            await prisma.position.update({ where: { id: positionId }, data: { lastRebalanced: new Date() } });

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
            const ticker = position.pairId.split('-')[0].toUpperCase();

            if (delta > 0) {
                // Short is too small (Under-hedged). Open more Short.
                 txPayload = await buildOpenPositionPayload({
                     vaultAddress: position.vaultAddress || position.user.walletAddress!,
                     amount: absDelta.toFixed(2),
                     leverage: 1,
                     symbol: ticker
                });
            } else {
                // Short is too big (Over-hedged). Close some Short.
                if (Math.abs(delta) < 10) { 
                    Logger.info('ExecutionService', 'Skipping small partial close rebalance', positionId);
                    return; 
                }
                
                // Partial Close
                txPayload = await buildClosePositionPayload({
                     vaultAddress: position.vaultAddress || position.user.walletAddress!,
                     positionId: position.id,
                     amount: absDelta.toFixed(2), // Reduce by specific amount
                     symbol: ticker
                });
            }

            if (!txPayload) {
                Logger.warn('ExecutionService', 'No rebalance payload generated (unsupported asset or no position).', positionId);
                return;
            }

            // Wrap & Broadcast
             const rawMessages = [
                 { to: Address.parse(txPayload.to), value: BigInt(txPayload.value), body: txPayload.body ? Cell.fromBase64(txPayload.body) : undefined }
             ];

             const targetAddress = position.vaultAddress ? Address.parse(position.vaultAddress) : Address.parse(position.user.walletAddress!);

             // 0. Safety Check
             await ExecutionService.ensureSolvencyOrStasis(positionId, targetAddress.toString(), 0.05, 'REBALANCE_DELTA');

             const keeperRefundMsg = {
                  to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!),
                  value: toNano('0.05'),
                  body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Delta Rebalance').endCell()
             };

             rawMessages.unshift(keeperRefundMsg);

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
                 data: { 
                    perpAmount: { increment: change },
                    lastRebalanced: new Date() 
                } 
             });

             Logger.info('ExecutionService', 'DELTA_REBALANCE_EXECUTED', positionId, { seqno: result.seqno });

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'DELTA_REBALANCE_FAILED', positionId, { error: err.message });
             throw err;
        }
    },

    /**
     * Monitors the vault after an exit request.
     * 1. Detects if funds arrive (Liquidation success).
     * 2. Sweeps funds to User (using Keeper extension).
     * 3. Marks position as Closed.
     */
    monitorAndSweep: async (positionId: string, vaultAddress: string, userWalletAddress: string) => {
        Logger.info('ExecutionService', 'Starting exit monitoring...', positionId, { vaultAddress });

        const maxRetries = 60; // 60 retries * 10s = 600s (10 mins)
        const pollIntervalMs = 10000;

        // Flags to track state across polls
        let fundsSwept = false;
        let fundsDetected = false;

        // Helper to sweep
        const sweepFunds = async () => {
             Logger.info('ExecutionService', 'Funds Detected! Executing SWEEP...', positionId);
             try {
                const targetAddress = Address.parse(vaultAddress);
                const userAddress = Address.parse(userWalletAddress);
                
                 // Build Sweep Payload (Mode 128 to User)
                 const sweepMsg = {
                    to: userAddress,
                    value: BigInt(0), 
                    mode: 128, // CARRY_ALL_REMAINING_BALANCE
                    body: beginCell().storeUint(0, 32).storeStringTail('Pamelo: Position Closed').endCell()
                };

                 const wrappedCell = await wrapWithKeeperRequest(targetAddress, [sweepMsg]);

                 const txs = [{
                    address: targetAddress.toString(),
                    value: '50000000', // 0.05 TON for gas
                    cell: wrappedCell.toBoc().toString('base64')
                 }];

                 await firstValueFrom(sendTransactions$(txs));
                 fundsSwept = true;
                 Logger.info('ExecutionService', 'SWEEP_TX_SENT', positionId);
             } catch (e) {
                 Logger.error('ExecutionService', 'SWEEP_FAILED', positionId, { error: (e as Error).message });
             }
        };

        // Start Polling
        // Run as background structure (async loop)
        (async () => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const balanceNano = await getTonBalance(vaultAddress);
                    const balanceTON = Number(fromNano(balanceNano));

                    Logger.info('ExecutionService', `Monitor Pulse: ${balanceTON} TON`, positionId, { retry: i });

                    // Case A: Funds Arrived (e.g. > 0.25 TON) -> Trigger Sweep
                    if (balanceTON > 0.25 && !fundsSwept) {
                        fundsDetected = true;
                        await sweepFunds();
                        // Don't return yet, wait for balance to drop to confirm
                    }

                    // Case B: Safe/Empty State (e.g. < 0.25 TON) -> Confirm Close
                    // We check if we either just swept OR if we are just verifying a clean state
                    if (balanceTON < 0.25) {
                         // If we saw funds and now they are gone, OR if we never saw large funds but time passed (maybe user swept manually?)
                         // Actually, if we never saw funds, we might be waiting for them to arrive. 
                         // But if 10 mins pass and no funds, we eventually timeout.
                         
                         // Determine if we should close.
                         // If we triggered a sweep, we definitely close.
                         // If the balance is already effectively zero and we didn't sweep, maybe the user did.
                         if (fundsSwept || i > 5) {
                             Logger.info('ExecutionService', 'VAULT_EMPTY_CONFIRMED. Closing Position.', positionId);
                             
                             await prisma.position.update({
                                 where: { id: positionId },
                                 data: { status: 'closed', updatedAt: new Date() }
                             });
                             
                             return; // Exit Loop
                         }
                    }
                } catch (e) {
                    Logger.warn('ExecutionService', 'Monitor Error', positionId, { error: (e as Error).message });
                }

                await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
            }
            Logger.warn('ExecutionService', 'MONITOR_TIMEOUT', positionId);
        })();
    },

    /**
     * Executes a full force-exit on a vault.
     * Closes any open Storm/StonFi positions and then sweeps all TON to the user.
     * This is triggered by the Keeper Monitor after a user deposit.
     */
    forceVaultExit: async (positionId: string, vaultAddress: string, userWalletAddress: string) => {
        Logger.info('ExecutionService', 'Executing FORCE_VAULT_EXIT...', positionId, { vaultAddress });

        try {
            const position = await prisma.position.findUnique({ 
                where: { id: positionId },
                include: { user: true }
            });

            if (!position) throw new Error("Position not found");

            const messages: any[] = [];
            const vaultAddrStr = vaultAddress;
            const ticker = position.pairId.split('-')[0].toUpperCase();

            // 1. Close Positions (if Active)
            if (position.status === 'active' || position.status === 'stasis_active' || position.status === 'processing_exit' || position.status === 'exit_monitoring') {
                Logger.info('ExecutionService', `Position Active/Processing. Generating Close/Sell payloads for ${ticker}...`, positionId);

                // Close Short
                try {
                    const { buildClosePositionPayload } = await import('./storm');
                    const closeShortTx = await buildClosePositionPayload({
                        vaultAddress: vaultAddrStr,
                        positionId: position.id,
                        symbol: ticker
                    });
                    if (closeShortTx) {
                         messages.push({
                            to: Address.parse(closeShortTx.to),
                            value: BigInt(closeShortTx.value || 0),
                            body: closeShortTx.body ? Cell.fromBase64(closeShortTx.body) : undefined 
                         });
                    }
                } catch (e) {
                    Logger.warn('ExecutionService', `[FORCE_EXIT] Could not build close short.`, positionId);
                }

                // Sell Spot
                try {
                    if (position.spotAmount > 0) {
                        const quote = await swapcoffee.getQuote(ticker, 'TON', toNano(position.spotAmount.toString()).toString());
                        const minOut = (BigInt(quote.to_amount) * BigInt(95)) / BigInt(100);

                        const sellSpotTx = await swapcoffee.buildSwapTx({
                            userWalletAddress: vaultAddrStr,
                            fromToken: ticker,
                            toToken: 'TON',
                            amount: position.spotAmount.toString(),
                            minOutput: minOut.toString()
                        });

                        messages.push({
                            to: Address.parse(sellSpotTx.to),
                            value: BigInt(sellSpotTx.value),
                            body: typeof sellSpotTx.body === 'string' ? Cell.fromBase64(sellSpotTx.body) : sellSpotTx.body
                        });
                    }
                } catch (e) {
                     Logger.warn('ExecutionService', `[FORCE_EXIT] Could not build spot sell.`, positionId);
                }
            }

            // 2. Refund 0.05 TON to Keeper (Gas Cost) - Before Status Check? No, always.
            // This ensures Keeper is refunded for the gas it spent triggering this.
            // For User Exits, Keeper gets +0.05 (User), spends 0.05 (Vault), gets +0.05 (Vault), Refunds User 0.03.
            // Net = 0.02.
            messages.push({
                to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!),
                value: toNano('0.05'),
                body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Exit').endCell()
            });

            // 3. Add User Sweep (Carry all remaining)
            messages.push({
                to: Address.parse(userWalletAddress),
                value: BigInt(0),
                body: beginCell().storeUint(0, 32).storeStringTail('Pamelo: Automated Refund').endCell(),
                mode: 128
            });

            // 3. Wrap & Send
            const targetAddress = Address.parse(vaultAddrStr);
            const wrappedCell = await wrapWithKeeperRequest(targetAddress, messages);

            const txs = [{
                address: targetAddress.toString(),
                value: '50000000', // Use the 0.05 TON provided by the user
                cell: wrappedCell.toBoc().toString('base64')
            },
            // FEE REFUND: Keeper sends 0.03 TON back to user (User paid 0.05, Fee is 0.02)
            {
                address: userWalletAddress,
                value: '30000000', // 0.03 TON
                cell: beginCell().storeUint(0, 32).storeStringTail("Pamelo: Exit Refund").endCell().toBoc().toString('base64')
            }];

            const result = await firstValueFrom(sendTransactions$(txs));
            Logger.info('ExecutionService', 'FORCE_EXIT_BROADCASTED', positionId, { seqno: result.seqno });

            // 4. Fire monitor to confirm closure in DB
            await ExecutionService.monitorAndSweep(position.id, vaultAddrStr, userWalletAddress);

        } catch (error: unknown) {
             const err = error instanceof Error ? error : new Error(String(error));
             Logger.error('ExecutionService', 'FORCE_VAULT_EXIT_FAILED', positionId, { error: err.message });
             throw err;
        }
    }
};
