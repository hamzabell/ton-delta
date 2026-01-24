/* eslint-disable */
import { prisma } from './prisma';
import { buildAtomicExitTx } from './fees';
import { sendTransactions$ } from './custodialWallet';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../services/logger';
import { buildClosePositionPayload, buildOpenPositionPayload } from './storm';
import { swapcoffee } from './swapcoffee';
import { Buffer } from 'buffer';
import { wrapWithKeeperRequest } from './w5-utils';
import { Address, Cell, toNano, fromNano, beginCell } from '@ton/core';
import { getTonBalance } from './onChain';

/**
 * Service to handle actual on-chain execution of critical strategy actions.
 * Centralizes "Exit" logic so it can be called by both Strategy Job (Expiry) and Risk Job (Max Loss).
 */
export const ExecutionService = {

    /**
     * Checks if the Vault has enough solvent funds to perform the current action AND still afford a future Panic Unwind.
     * If insolvent, it AUTOMATICALLY triggers a Panic Unwind and throws a stoppage error.
     */
    ensureSolvencyOrPanic: async (positionId: string, vaultAddress: string, currentActionCost: number, actionName: string) => {
        try {
            const balanceNano = await getTonBalance(vaultAddress);
            const balanceTON = Number(fromNano(balanceNano));

            // Required: Panic Cost (0.15) + Current Action (Refund 0.05) + Small Buffer (0.05)
            const PANIC_RESERVE = 0.15;
            const BUFFER = 0.05;
            const requiredParam = PANIC_RESERVE + currentActionCost + BUFFER;

            Logger.info('ExecutionService', 'SOLVENCY_CHECK', positionId, { 
                action: actionName,
                balance: balanceTON,
                required: requiredParam
            });

            if (balanceTON < requiredParam) {
                Logger.warn('ExecutionService', `SOLVENCY_FAILURE: Vault balance (${balanceTON}) < Required (${requiredParam}). Triggering Pre-emptive Panic Unwind.`, positionId);
                
                // Trigger Panic immediately
                await ExecutionService.executePanicUnwind(positionId, `Solvency Check Failed during ${actionName}`);
                
                // Throw specific error to halt the original action
                throw new Error(`SOLVENCY_EXIT_TRIGGERED: Vault had insufficient funds for ${actionName} + Future Exit.`);
            }

            return true;
        } catch (e) {
            // If it's our own solvency error, rethrow it. 
            // If getTonBalance fails, we probably shouldn't proceed anyway.
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
            // 1. Gas Buffer (Standard): 0.1 TON (kept for compute)
            // 2. Keeper Entry Fee: 0.1 TON (sent to keeper immediately)
            // 3. Exit Insurance Reserve: 0.15 TON (kept in vault for future panic unwind)
            const ENTRY_FEE = 0.1;
            const EXIT_INSURANCE = 0.15;
            const GAS_BUFFER = 0.1;
            
            const totalReserved = ENTRY_FEE + EXIT_INSURANCE + GAS_BUFFER;

            if (balance < totalReserved) {
                 throw new Error(`Insufficient Vault Balance for Fees: Has ${balance} TON, Need ${totalReserved} TON`);
            }
            
            // The "Investable" amount is what remains after reserving all fees/buffers
            const investableAmount = balance - totalReserved;

            const spotAlloc = investableAmount * 0.5;
            const marginAlloc = investableAmount * 0.5;

            const ticker = position.pairId.split('-')[0].toUpperCase();

            // 1. Swap 50% TON -> Spot
            const buySpotTx = await swapcoffee.buildSwapTx({
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
                 { to: Address.parse(openShortTx.to), value: BigInt(openShortTx.value), body: openShortTx.body ? Cell.fromBase64(openShortTx.body) : undefined }
             ];

             // --- KEEPER ENTRY FEE / TOP UP ---
             // Send 0.1 TON to Keeper to fuel future actions (Auto-Refuel seed)
             if (process.env.NEXT_PUBLIC_KEEPER_ADDRESS) {
                 rawMessages.push({
                     to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS),
                     value: toNano("0.1"),
                     body: undefined
                 });
                 Logger.info('ExecutionService', 'Added 0.1 TON Entry Fee/TopUp for Keeper', positionId);
             }

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
     * Handles different position modes:
     * - Cash Stasis: Direct refund (no liquidation)
     * - Basis/Active: Close short + sell spot -> TON, then refund
     */
    executePanicUnwind: async (positionId: string, reason: string, destinationAddress?: string) => {
        Logger.info('ExecutionService', `Initiating Panic Unwind. Reason: ${reason}`, positionId);

        try {
            // Set status to processing_exit immediately
            await prisma.position.update({
                where: { id: positionId },
                data: { status: 'processing_exit' }
            });

            const position = await prisma.position.findUnique({
                where: { id: positionId },
                include: { user: true }
            });

            if (!position) {
                throw new Error(`Position ${positionId} not found`);
            }

            // CRITICAL: Validate addresses FIRST before any usage
            const userWalletAddr = position.user.walletAddress || position.userId;
            if (!userWalletAddr) {
                throw new Error(`User wallet address is missing for position ${positionId}`);
            }

            if (!process.env.NEXT_PUBLIC_KEEPER_ADDRESS) {
                throw new Error('NEXT_PUBLIC_KEEPER_ADDRESS environment variable is not configured');
            }

            // Use validated wallet address for ALL operations
            const vaultOrWalletAddr = position.vaultAddress || userWalletAddr;

            const entryValue = position.spotAmount * position.entryPrice;
            const currentEquity = position.totalEquity || entryValue * 0.9; 

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

            // 1. Build Liquidation Payloads based on Position Mode
            const liquidationMessages: { to: Address, value: bigint, body?: Cell }[] = [];
            let liquidationDescription = 'No liquidation needed';

            // MODE 1: CASH STASIS - Direct refund, no liquidation
            if (position.status === 'stasis') {
                Logger.info('ExecutionService', `[CASH STASIS] Position is in Cash Stasis mode. Cash is already in contract. Proceeding directly to refund.`, positionId);
                liquidationDescription = 'Cash Stasis - Direct Refund';
            }
            
            // MODE 3: BASIS/ACTIVE - Close short + sell spot to TON, then refund
            else if (position.status === 'active') {
                Logger.info('ExecutionService', `[BASIS MODE] Position is in Active Basis mode. Closing short and selling spot to TON...`, positionId);
                
                const ticker = position.pairId.split('-')[0].toUpperCase();
                
                // Step 1: Close Short Position (Storm Trade)
                try {
                    Logger.info('ExecutionService', `[BASIS MODE] Building short closure for ${ticker}...`, positionId);
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
                        Logger.info('ExecutionService', `[BASIS MODE] Short closure payload added for ${ticker}`, positionId);
                    }
                } catch (e) {
                    Logger.warn('ExecutionService', `[BASIS MODE] Could not close short for ${ticker} (likely already closed or unsupported). Continuing...`, positionId);
                }

                // Step 2: Sell Spot to TON (Swap Coffee)
                try {
                    Logger.info('ExecutionService', `[BASIS MODE] Building spot sale for ${ticker} -> TON...`, positionId);
                    const quote = await swapcoffee.getQuote(
                        ticker,
                        'TON',
                        toNano(position.spotAmount.toString()).toString()
                    );
                    
                    const expectedOutput = quote.to_amount || '0';
                    const priceImpact = Number(quote.price_impact || 0);

                    // Slippage Protected Output (95% for panic)
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
                    Logger.info('ExecutionService', `[BASIS MODE] Spot sale payload added for ${ticker} -> TON`, positionId);
                } catch (e) {
                     Logger.warn('ExecutionService', `[BASIS MODE] Could not sell spot ${ticker} via Swap Coffee (unsupported or no liquidity). Continuing...`, positionId);
                }

                liquidationDescription = liquidationMessages.length > 0 
                    ? `Basis Mode - Closed short and sold spot for ${ticker}`
                    : 'Basis Mode - Liquidation failed, proceeding to refund';
                
                // Warn if no liquidation was possible for active position
                if (liquidationMessages.length === 0) {
                    Logger.warn('ExecutionService', '[BASIS MODE] No on-chain liquidation possible (orphaned or unsupported position). Proceeding with sweep and revocation to release user funds.', positionId);
                }
            }

            Logger.info('ExecutionService', `Liquidation phase complete. Building refund transaction...`, positionId);
            Logger.info('ExecutionService', `Liquidation summary: ${liquidationDescription}`, positionId);
            
            const keeperAddress = safeParseAddress(process.env.NEXT_PUBLIC_KEEPER_ADDRESS, 'NEXT_PUBLIC_KEEPER_ADDRESS');
            const targetAddress = position.vaultAddress ? safeParseAddress(position.vaultAddress, 'position.vaultAddress') : safeParseAddress(userWalletAddr, 'userWalletAddr');
            
            // CRITICAL: Check vault balance before attempting refund
            const vaultBalance = await getTonBalance(targetAddress.toString());
            const vaultBalanceTON = Number(fromNano(vaultBalance));
            
            Logger.info('ExecutionService', `Vault balance: ${vaultBalanceTON} TON`, positionId);
            
            if (vaultBalanceTON < 0.01) {
                Logger.warn('ExecutionService', 'Vault balance too low for refund. Marking position as closed.', positionId);
                await prisma.position.update({
                    where: { id: positionId },
                    data: { status: 'closed', exitTxHash: 'insufficient_balance' }
                });
                throw new Error(`Vault balance too low: ${vaultBalanceTON} TON`);
            }
            
            // 2. Build Exit Transfers (Fee + Sweep to User)
            
            // Calculate total value attached to liquidation messages (TON)
            const liquidationCostNano = liquidationMessages.reduce((sum: bigint, msg) => sum + msg.value, BigInt(0));
            const liquidationCostTON = Number(fromNano(liquidationCostNano));
            
            Logger.info('ExecutionService', 'Liquidation Cost Calculation', positionId, { 
                count: liquidationMessages.length, 
                costTON: liquidationCostTON 
            });

            // Reserve for Storage/Gas (keeping extension alive)
            const reserveAmount = 0.15; 
            
            // Available = Balance - LiquidationCost - Reserve
            // Note: We ignore the incoming Keeper Boost (0.15) to be conservative/safe.
            const safeWithdrawAmount = vaultBalanceTON - liquidationCostTON - reserveAmount;
                 
            if (safeWithdrawAmount <= 0) {
                 Logger.warn('ExecutionService', `Zero or negative withdrawable amount (${safeWithdrawAmount}). Sweeping skipped.`, positionId);
                 // If liquidation occurred, we still close. But refund is 0.
            }

            Logger.info('ExecutionService', `Calculating safe exit amount: ${safeWithdrawAmount} TON (Bal: ${vaultBalanceTON} - Liq: ${liquidationCostTON} - Res: ${reserveAmount})`, positionId);

            const { messages: exitMessages, summary } = buildAtomicExitTx({
                 userAddress: destinationAddress || userWalletAddr,
                 totalAmountTon: safeWithdrawAmount > 0 ? safeWithdrawAmount : 0, 
                 entryValueTon: entryValue 
            });

            Logger.info('ExecutionService', 'Generated Exit Fee Transfers', positionId, summary);

            // 3. Combine Liquidation + Exit Messages
            // CRITICAL: Exit messages already have correct values from buildAtomicExitTx
            // The last message should use mode 128 (CARRY_ALL) to sweep remaining balance
            const rawMessages = [
                // 3.0. Refund Keeper for Panic Unwind Gas (0.05 TON)
                {
                    to: keeperAddress,
                    value: toNano('0.05'),
                    body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Panic Unwind').endCell()
                },
                ...liquidationMessages,
                // Exit Transfers (Fee & Sweep) - use messages as-is from buildAtomicExitTx
                ...exitMessages.map((msg, index) => {
                    const isLastMessage = index === exitMessages.length - 1;
                    return {
                        to: msg.to,
                        value: msg.value,
                        body: msg.body,
                        mode: 128 // CARRY_ALL_REMAINING_BALANCE (Sweeps everything to user)
                    };
                })
            ];
            
            // 4. Wrap with W5 Keeper Request
            // CRITICAL: Do NOT revoke keeper here - it prevents the refund from working!
            // The vault will be emptied by mode 128, so keeper revocation is unnecessary
            const wrappedCell = await wrapWithKeeperRequest(
                targetAddress, 
                rawMessages
                // NO keeper revocation - let the vault empty naturally
            );

            // 5. Broadcast Transaction
            const txs = [{
                address: targetAddress.toString({ bounceable: false }),
                value: '150000000', // Increased to 0.15 TON to cover multi-action gas
                cell: wrappedCell.toBoc().toString('base64')
            }];

            Logger.info('ExecutionService', 'Broadcasting exit transaction...', positionId);
            
            const result = await firstValueFrom(sendTransactions$(txs));
            
            // We use the seqno as a temporary reference. Real hash would require parsing the message cell.
            const txHash = `exit_seq_${result.seqno}_${Date.now()}`; 
            
            // 6. Update Position Status to 'processing_exit' instead of jumping to 'closed'
            // This ensures we validate the refund on-chain before final closure.
            await prisma.position.update({
                where: { id: positionId },
                data: { 
                    status: 'processing_exit',
                    exitTxHash: txHash,
                    updatedAt: new Date()
                }
            });

            Logger.warn('ExecutionService', 'REFUND_SEQUENCE_INITIATED', positionId, {
                reason,
                txHash,
                mode: position.status,
                liquidationSummary: liquidationDescription,
                feeSummary: summary,
                seqno: result.seqno
            });

            // 7. ASYNC VALIDATION: Start polling for refund completion
            // We don't await this to return the API response quickly
            (async () => {
                try {
                    await ExecutionService.validateRefundAndRevoke(positionId, targetAddress.toString());
                } catch (e) {
                    Logger.error('ExecutionService', 'ASYNC_REFUND_VALIDATION_FAILED', positionId, { error: (e as Error).message });
                }
            })();

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
             await ExecutionService.ensureSolvencyOrPanic(positionId, targetAddress.toString(), 0.05, 'ENTER_STASIS');


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
             await ExecutionService.ensureSolvencyOrPanic(positionId, targetAddress.toString(), 0.05, 'EXIT_STASIS');

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
            await ExecutionService.ensureSolvencyOrPanic(positionId, targetAddress.toString(), 0.05, 'REBALANCE_POSITION');

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
             await ExecutionService.ensureSolvencyOrPanic(positionId, targetAddress.toString(), 0.05, 'REBALANCE_DELTA');

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
     * Polls the vault balance and revokes the keeper extension once the refund is validated.
     */
    validateRefundAndRevoke: async (positionId: string, vaultAddress: string) => {
        Logger.info('ExecutionService', 'Starting refund validation polling...', positionId, { vaultAddress });

        const maxRetries = 30; // 30 retries * 10s = 300s (5 mins)
        const pollIntervalMs = 10000;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const balanceNano = await getTonBalance(vaultAddress);
                const balanceTON = Number(fromNano(balanceNano));

                Logger.info('ExecutionService', `Polling vault balance: ${balanceTON} TON (Retry ${i+1}/${maxRetries})`, positionId);

                // Validation Threshold: If balance is low enough, it means the sweep was successful
                // Validation Threshold: If balance is lower than before? 
                // Or checking if the *USER* received funds?
                // Checking vault balance: It should have decreased to ~0.1
                
                if (balanceTON < 0.2) {
                    Logger.warn('ExecutionService', 'REFUND_VALIDATED: Vault balance reduced to safe limit. Extension kept.', positionId);
                    
                    // Update Status to closed
                    await prisma.position.update({
                        where: { id: positionId },
                        data: { status: 'closed', updatedAt: new Date() }
                    });

                    Logger.info('ExecutionService', 'POSITION_CLOSED_VAULT_PRESERVED', positionId);
                    return;
                }
            } catch (e) {
                Logger.warn('ExecutionService', `Polling error: ${(e as Error).message}. Retrying...`, positionId);
            }

            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        Logger.error('ExecutionService', 'REFUND_VALIDATION_TIMEOUT: Vault balance did not clear within 5 minutes.', positionId);
    },

    /**
     * Standalone method to remove the Keeper as an extension from a vault.
     */
    revokeKeeper: async (positionId: string, vaultAddress: string) => {
        Logger.info('ExecutionService', 'Revoking Keeper extension...', positionId, { vaultAddress });

        try {
            const keeperAddress = Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!);
            const targetAddress = Address.parse(vaultAddress);

            // Build payload with NO messages, only extension removal
            const wrappedCell = await wrapWithKeeperRequest(
                targetAddress,
                [], // Empty messages
                keeperAddress // Revoke ourselves
            );

            const txs = [{
                address: targetAddress.toString({ bounceable: false }),
                value: '50000000', // 0.05 TON for gas
                cell: wrappedCell.toBoc().toString('base64')
            }];

            const result = await firstValueFrom(sendTransactions$(txs));
            Logger.info('ExecutionService', 'KEEPER_REVOKE_BROADCASTED', positionId, { seqno: result.seqno });
            
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            Logger.error('ExecutionService', 'KEEPER_REVOKE_FAILED', positionId, { error: err.message });
            // We don't throw here to avoid failing the async validation flow permanently
        }
    }
};
