/**
 * Sweep remaining TON from vault to owner
 */
import 'dotenv/config';
import { Address, toNano, Cell, fromNano, beginCell } from '@ton/core';
import { getTonClient } from '../lib/onChain';
import { wrapWithKeeperRequest } from '../lib/w5-utils';
import { sendTransactions$ } from '../lib/custodialWallet';
import { firstValueFrom } from 'rxjs';

async function sweepVault(vaultAddr: string, userAddr: string) {
    try {
        console.log('\n💸 Sweeping Vault to User');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Vault: ${vaultAddr}`);
        console.log(`User:  ${userAddr}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const client = await getTonClient();
        const vaultAddress = Address.parse(vaultAddr);
        const userAddress = Address.parse(userAddr);

        // Check balance
        console.log('💵 Checking vault balance...');
        const balance = await client.getBalance(vaultAddress);
        console.log(`✓ Vault TON Balance: ${fromNano(balance)} TON\n`);

        if (balance <= toNano('0.01')) {
            console.log('⚠️  Balance too low to sweep (≤ 0.01 TON).\n');
            return;
        }

        // Reserve minimal gas for the sweep transaction itself
        const sweepAmount = balance - toNano('0.01');
        console.log(`💰 Sweeping ${fromNano(sweepAmount)} TON to user...\n`);

        const sweepMessage = {
            to: userAddress,
            value: sweepAmount,
            body: beginCell().storeUint(0, 32).storeStringTail('Refund: Exit').endCell()
        };

        const wrappedCell = await wrapWithKeeperRequest(vaultAddress, [sweepMessage]);
        
        const txs = [{
            address: vaultAddress.toString(),
            value: '50000000', // 0.05 TON for gas
            cell: wrappedCell.toBoc().toString('base64')
        }];

        console.log('📤 Broadcasting sweep transaction...');
        const result = await firstValueFrom(sendTransactions$(txs));
        console.log(`✓ Sweep broadcasted! Seqno: ${result.seqno}\n`);
        
        // Wait for confirmation
        console.log('⏳ Waiting for confirmation (15 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Check final balance
        const finalBalance = await client.getBalance(vaultAddress);
        console.log(`\n📊 Final vault balance: ${fromNano(finalBalance)} TON`);
        console.log(`✅ User received: ~${fromNano(balance - finalBalance)} TON\n`);

        console.log('✅ Sweep complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error);
        throw error;
    }
}

const vaultAddr = process.argv[2];
const userAddr = process.argv[3];

if (!vaultAddr || !userAddr) {
    console.error('Usage: ts-node src/scripts/sweep-vault.ts <vaultAddress> <userAddress>');
    process.exit(1);
}

sweepVault(vaultAddr, userAddr)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
