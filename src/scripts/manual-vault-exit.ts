/**
 * Manual Vault Exit Script
 * 
 * This script manually executes token liquidation from a vault:
 * 1. Fetch real jetton balance from vault
 * 2. Build Ston.fi swap transaction (Jetton -> TON)
 * 3. Display transaction details for manual execution
 * 
 * Usage: ts-node src/scripts/manual-vault-exit.ts <vaultAddress> <ticker>
 */

import { Address, fromNano, toNano, beginCell } from '@ton/core';
import { stonfi } from '../lib/stonfi';
import { getTonClient } from '../lib/onChain';

async function manualVaultExit(vaultAddr: string, ticker: string) {
    try {
        console.log('\n🔍 Manual Vault Exit');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Vault:  ${vaultAddr}`);
        console.log(`Ticker: ${ticker}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 1. Resolve token address
        console.log('📍 Resolving token address...');
        const tokenAddr = await stonfi.resolveTokenAddress(ticker);
        if (!tokenAddr) {
            throw new Error(`Could not resolve token address for ${ticker}`);
        }
        console.log(`✓ Token Address: ${tokenAddr}\n`);

        // 2. Get real jetton balance from blockchain
        console.log('💰 Fetching jetton balance...');
        const realBalance = await stonfi.getJettonBalance(vaultAddr, tokenAddr);
        console.log(`✓ Balance (nano): ${realBalance.toString()}`);
        console.log(`✓ Balance (human): ${fromNano(realBalance)} ${ticker}\n`);

        if (realBalance === BigInt(0)) {
            console.log('⚠️  No tokens found in vault.\n');
            
            // Check if there's TON to sweep
            console.log('💵 Checking vault TON balance...');
            const client = await getTonClient();
            const tonBalance = await client.getBalance(Address.parse(vaultAddr));
            console.log(`✓ Vault TON Balance: ${fromNano(tonBalance)} TON\n`);
            
            if (tonBalance > toNano('0.01')) {
                console.log('💡 Vault has TON but no tokens. You may want to sweep the vault directly.\n');
            }
            return;
        }

        // 3. Build swap transaction (Jetton -> TON)
        console.log('🔨 Building swap transaction...');
        const swapTx = await stonfi.buildSwapTx({
            userWalletAddress: vaultAddr,
            fromToken: ticker,
            toToken: 'TON',
            amount: fromNano(realBalance),
            tokenAddress: tokenAddr
        });

        console.log('✓ Swap transaction built\n');

        // 4. Display transaction details
        console.log('📦 Swap Transaction Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`To:       ${swapTx.to}`);
        console.log(`Value:    ${swapTx.value}`);
        console.log(`Body:     ${swapTx.body?.substring(0, 60)}...`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 5. Display execution instructions
        console.log('🚀 NEXT STEPS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nThis transaction needs to be sent FROM the vault.');
        console.log('The vault must sign and broadcast this transaction.\n');
        
        console.log('Transaction Parameters:');
        console.log(`  From:    ${vaultAddr}`);
        console.log(`  To:      ${swapTx.to}`);
        console.log(`  Amount:  ${swapTx.value} nano TON`);
        console.log(`  Payload: ${swapTx.body}\n`);

        console.log('If using Keeper service or SDK with vault private key:');
        console.log('  - Use ExecutionService.wrapWithKeeperRequest()');
        console.log('  - Or sign directly with vault wallet\n');

        // 6. Check vault balance after
        console.log('📊 After swap completes, check vault balance with:');
        console.log(`  npx ts-node -e "import { getTonClient } from './src/lib/onChain'; import { Address, fromNano } from '@ton/core'; (async () => { const client = await getTonClient(); const bal = await client.getBalance(Address.parse('${vaultAddr}')); console.log('Vault TON Balance:', fromNano(bal), 'TON'); })()"\n`);

        console.log('✅ Manual exit preparation complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Return transaction details for programmatic use
        return {
            vaultAddress: vaultAddr,
            tokenAddress: tokenAddr,
            tokenBalance: realBalance,
            swapTransaction: swapTx
        };

    } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error);
        throw error;
    }
}

// CLI execution
const vaultAddr = process.argv[2];
const ticker = process.argv[3] || 'WLD';

if (!vaultAddr) {
    console.error('Usage: ts-node src/scripts/manual-vault-exit.ts <vaultAddress> [ticker]');
    console.error('Example: ts-node src/scripts/manual-vault-exit.ts UQDs3Y... WLD');
    process.exit(1);
}

manualVaultExit(vaultAddr, ticker)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
