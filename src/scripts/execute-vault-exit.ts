/**
 * Execute Vault Exit Script
 * 
 * This script executes the complete exit flow for a vault:
 * 1. Sell tokens on Ston.fi (Jetton -> TON)
 * 2. Wait for swap completion
 * 3. Sweep remaining TON back to user
 * 
 * Usage: ts-node src/scripts/execute-vault-exit.ts <vaultAddress> <ticker> <userAddress>
 */

import 'dotenv/config';
import { Address, fromNano, toNano, Cell } from '@ton/core';
import { stonfi } from '../lib/stonfi';
import { getTonClient } from '../lib/onChain';
import { wrapWithKeeperRequest } from '../lib/w5-utils';
import { sendTransactions$ } from '../lib/custodialWallet';
import { firstValueFrom } from 'rxjs';

async function executeVaultExit(vaultAddr: string, ticker: string, userAddr: string) {
    try {
        console.log('\n🚀 Executing Vault Exit');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Vault:  ${vaultAddr}`);
        console.log(`Ticker: ${ticker}`);
        console.log(`User:   ${userAddr}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const client = await getTonClient();
        const vaultAddress = Address.parse(vaultAddr);
        const userAddress = Address.parse(userAddr);

        // Step 1: Check vault TON balance
        console.log('💵 Checking vault balance...');
        const initialBalance = await client.getBalance(vaultAddress);
        console.log(`✓ Vault TON Balance: ${fromNano(initialBalance)} TON\n`);

        // Step 2: Resolve token address
        console.log('📍 Resolving token address...');
        const tokenAddr = await stonfi.resolveTokenAddress(ticker);
        if (!tokenAddr) {
            throw new Error(`Could not resolve token address for ${ticker}`);
        }
        console.log(`✓ Token Address: ${tokenAddr}\n`);

        // Step 3: Get real jetton balance
        console.log('💰 Fetching jetton balance...');
        const realBalance = await stonfi.getJettonBalance(vaultAddr, tokenAddr);
        console.log(`✓ Balance (nano): ${realBalance.toString()}`);
        console.log(`✓ Balance (human): ${fromNano(realBalance)} ${ticker}\n`);

        if (realBalance === BigInt(0)) {
            console.log('⚠️  No tokens to sell. Checking if there\'s TON to sweep...\n');
            
            if (initialBalance > toNano('0.1')) {
                console.log('💸 Sweeping TON directly to user...');
                await sweepTonToUser(vaultAddress, userAddress, initialBalance);
                console.log('✅ Sweep complete!\n');
            } else {
                console.log('ℹ️  No significant balance to sweep.\n');
            }
            return;
        }

        // Step 4: Build swap transaction
        console.log('🔨 Building swap transaction...');
        const swapTx = await stonfi.buildSwapTx({
            userWalletAddress: vaultAddr,
            fromToken: ticker,
            toToken: 'TON',
            amount: fromNano(realBalance),
            tokenAddress: tokenAddr
        });
        console.log('✓ Swap transaction built\n');

        // Step 5: Wrap and send via keeper
        console.log('📤 Sending swap transaction via Keeper...');
        const swapMessage = {
            to: Address.parse(swapTx.to),
            value: BigInt(swapTx.value),
            body: typeof swapTx.body === 'string' ? Cell.fromBase64(swapTx.body) : swapTx.body
        };

        const wrappedCell = await wrapWithKeeperRequest(vaultAddress, [swapMessage]);
        
        // Keeper funds the vault with 0.3 TON to cover swap gas (0.22) + processing (0.05) + buffer
        const txs = [{
            address: vaultAddress.toString(),
            value: '300000000', // 0.3 TON
            cell: wrappedCell.toBoc().toString('base64')
        }];

        const result = await firstValueFrom(sendTransactions$(txs));
        console.log(`✓ Swap broadcasted! Seqno: ${result.seqno}\n`);

        // Step 6: Wait for swap to complete
        console.log('⏳ Waiting for swap to complete (30 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Step 7: Check new balance
        console.log('💵 Checking vault balance after swap...');
        const postSwapBalance = await client.getBalance(vaultAddress);
        console.log(`✓ Vault TON Balance: ${fromNano(postSwapBalance)} TON\n`);

        // Step 8: Sweep remaining TON to user
        if (postSwapBalance > toNano('0.1')) {
            console.log('💸 Sweeping remaining TON to user...');
            await sweepTonToUser(vaultAddress, userAddress, postSwapBalance);
            console.log('✓ Sweep complete!\n');
        } else {
            console.log('⚠️  Insufficient balance to sweep (less than 0.1 TON).\n');
        }

        // Step 9: Final balance check
        console.log('📊 Final vault balance...');
        const finalBalance = await client.getBalance(vaultAddress);
        console.log(`✓ Vault TON Balance: ${fromNano(finalBalance)} TON`);
        console.log(`✓ User received: ~${fromNano(postSwapBalance - finalBalance)} TON\n`);

        console.log('✅ Manual exit complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error);
        throw error;
    }
}

/**
 * Sweep TON from vault to user
 */
async function sweepTonToUser(vaultAddress: Address, userAddress: Address, balance: bigint) {
    // Reserve 0.05 TON for gas
    const sweepAmount = balance - toNano('0.05');
    
    if (sweepAmount <= 0) {
        throw new Error('Insufficient balance for sweep after gas reservation');
    }

    const sweepMessage = {
        to: userAddress,
        value: sweepAmount,
        body: Cell.fromBoc(Buffer.from('te6cckEBAQEADgAAGFJlZnVuZDogRXhpdAADAH0=', 'base64'))[0] // "Refund: Exit"
    };

    const wrappedCell = await wrapWithKeeperRequest(vaultAddress, [sweepMessage]);
    
    const txs = [{
        address: vaultAddress.toString(),
        value: '50000000', // 0.05 TON for gas
        cell: wrappedCell.toBoc().toString('base64')
    }];

    const result = await firstValueFrom(sendTransactions$(txs));
    console.log(`  Sweep broadcasted! Seqno: ${result.seqno}`);
    
    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 10000));
}

// CLI execution
const vaultAddr = process.argv[2];
const ticker = process.argv[3] || 'WLD';
const userAddr = process.argv[4];

if (!vaultAddr || !userAddr) {
    console.error('Usage: ts-node src/scripts/execute-vault-exit.ts <vaultAddress> <ticker> <userAddress>');
    console.error('Example: ts-node src/scripts/execute-vault-exit.ts UQDs3Y... WLD UQAbc...');
    process.exit(1);
}

executeVaultExit(vaultAddr, ticker, userAddr)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
