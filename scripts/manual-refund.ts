
import { PrismaClient } from '@prisma/client';
import { ExecutionService } from '../src/lib/execution';
import { Logger } from '../src/services/logger';
import dotenv from 'dotenv';
import { buildClosePositionPayload } from '../src/lib/storm';
import { swapcoffee } from '../src/lib/swapcoffee';
import { wrapWithKeeperRequest } from '../src/lib/w5-utils';
import { buildAtomicExitTx } from '../src/lib/fees';
import { getTonBalance } from '../src/lib/onChain';
import { Address, beginCell, toNano, fromNano, Cell } from '@ton/core';
import { sendTransactions$ } from '../src/lib/custodialWallet';
import { firstValueFrom } from 'rxjs';

dotenv.config();

const prisma = new PrismaClient();
// The requested vault
const TARGET_VAULT = 'UQDVyC4YBHIy_vqwPJiWptFhlpUf6oNtfFyLGyTf7X11F6Ri';
// The requested user
const TARGET_USER = 'UQB52Y8YQ0ISgpiEOeNH90lZ5oG1ln4YnzxM2ZuCzqAjMzT4';

async function main() {
  try {
    console.log(`Searching for position...`);
    
    let position = null;
    
    try {
        // 1. Try finding by Vault directly
        position = await prisma.position.findFirst({
        where: { vaultAddress: TARGET_VAULT },
        include: { user: true }
        });

        // 2. Fallback: Search by User Wallet if not found
        if (!position) {
        console.log('No position found by Vault Address. Searching by User Wallet...');
        const positions = await prisma.position.findMany({
            where: {
            user: { walletAddress: TARGET_USER }
            },
            include: { user: true }
        });

        if (positions.length > 0) {
            console.log(`Found ${positions.length} positions for user:`);
            for (const p of positions) {
                console.log(`- ID: ${p.id}, Status: ${p.status}, Vault: ${p.vaultAddress}, Pair: ${p.pairId}`);
                if (p.vaultAddress === TARGET_VAULT) {
                    console.log('  *** MATCH FOUND ***');
                    position = p;
                    break;
                }
            }
        }
        }
    } catch (dbError) {
        console.warn("Database lookup failed (DB might be unreachable). Proceeding to fallback.", dbError);
    }

    if (!position) {
        console.warn("Could not find a position matching the vault and user. FALLING BACK TO DIRECT SWEEP.");
        
        // Mock position object for the sweeper
        position = {
            id: 'manual-force-sweep',
            status: 'unknown',
            vaultAddress: TARGET_VAULT,
            user: { walletAddress: TARGET_USER },
            pairId: 'UNKNOWN',
            spotAmount: 0
        };
    }

    console.log(`Targeting Position: ${position.id} (Status: ${position.status})`);
    await executeForceExit(position);

  } catch (error) {
    console.error('Error executing refund:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function executeForceExit(position: any) {
    console.log(`STARTING FORCE EXIT (Keeper Sweep) for ${position.id}...`);
    
    const vaultAddressStr = position.vaultAddress || position.user.walletAddress;
    const userWalletStr = position.user.walletAddress;

    const messages: any[] = [];
    
    // 1. Close Positions (if Active)
    if (position.status === 'active' || position.status === 'stasis_active') {
        const ticker = position.pairId.split('-')[0].toUpperCase();
        console.log(`Position Active. Generating Close/Sell payloads for ${ticker}...`);

        // Close Short
        try {
            const closeShortTx = await buildClosePositionPayload({
                vaultAddress: vaultAddressStr,
                positionId: position.id,
                symbol: ticker
            });
            if (closeShortTx) {
                 messages.push({
                    to: Address.parse(closeShortTx.to),
                    value: BigInt(closeShortTx.value || 0),
                    body: closeShortTx.body ? Cell.fromBase64(closeShortTx.body) : undefined 
                 });
                 console.log(`- Added Close Short Msg`);
            }
        } catch (e) {
            console.warn(`- Failed to build Close Short (maybe already closed?): ${e}`);
        }

        // Sell Spot
        try {
            // Estimate amount from DB or just try to swap balance? 
            // We use DB spotAmount.
            if (position.spotAmount > 0) {
                const quote = await swapcoffee.getQuote(ticker, 'TON', toNano(position.spotAmount.toString()).toString());
                 // 5% slippage
                const minOut = (BigInt(quote.to_amount) * BigInt(95)) / BigInt(100);

                const sellSpotTx = await swapcoffee.buildSwapTx({
                    userWalletAddress: vaultAddressStr,
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
                console.log(`- Added Sell Spot Msg`);
            }
        } catch (e) {
             console.warn(`- Failed to build Sell Spot: ${e}`);
        }
    } else {
        console.log(`Position status is ${position.status}. Skipping trade unwinds.`);
    }

    // 2. Sweep Funds to User
    // We assume whatever is left (after trades settle) + current balance should go to user.
    // However, since we batch everything, the "Sweep" (Mode 128) must be the LAST message.
    
    // Calculate current available (for logging/check)
    const balanceNano = await getTonBalance(vaultAddressStr);
    const balanceTON = Number(fromNano(balanceNano));
    console.log(`Current Vault Balance: ${balanceTON} TON`);

    if (balanceTON < 0.1) {
        console.warn("Low balance. Transaction might fail if no gas.");
    }

    // Add Keeper Refund?
    const keeperRefundMsg = {
        to: Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS!),
        value: toNano('0.05'),
        body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Force Exit').endCell()
    };
    messages.unshift(keeperRefundMsg); // Put at start

    // Add User Sweep
    // We create a message to the user with mode 128.
    // Value doesn't matter much for mode 128, but we pass 0.
    const userSweepMsg = {
        to: Address.parse(userWalletStr),
        value: BigInt(0),
        body: beginCell().storeUint(0, 32).storeStringTail('Ref: Force Refund').endCell(),
        mode: 128 // CARRY ALL REMAINING BALANCE
    };
    messages.push(userSweepMsg);

    console.log(`Total Messages: ${messages.length}`);

    // 3. Wrap & Send
    const targetAddress = Address.parse(vaultAddressStr);
    const wrappedCell = await wrapWithKeeperRequest(targetAddress, messages);

    const txs = [{
        address: targetAddress.toString(),
        value: '100000000', // 0.1 TON gas
        cell: wrappedCell.toBoc().toString('base64')
    }];

    console.log('Sending Transaction...');
    const result = await firstValueFrom(sendTransactions$(txs));
    console.log(`Transaction Sent! Seqno: ${result.seqno}`);
    console.log('Force Exit complete.');
    
    // Update DB status to closed?
    // User might want to confirm first. But let's mark it as 'processing_exit' or similar if we could.
    // For now, just log.
}

main();
