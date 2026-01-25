
import { ExecutionService } from '../src/lib/execution';
import { sendTransactions$ } from '../src/lib/custodialWallet';
import { wrapWithKeeperRequest } from '../src/lib/w5-utils';
import { getTonBalance } from '../src/lib/onChain';
import { buildAtomicExitTx } from '../src/lib/fees';
import { Address, toNano, beginCell } from '@ton/core';
import { firstValueFrom } from 'rxjs';
import dotenv from 'dotenv';
import { Logger } from '../src/services/logger';

dotenv.config();

// USAGE: npx tsx scripts/force-refund-no-db.ts <VAULT_ADDRESS> <USER_WALLET_ADDRESS>

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx tsx scripts/force-refund-no-db.ts <VAULT_ADDRESS> <USER_WALLET_ADDRESS>');
        process.exit(1);
    }

    const [vaultAddress, userWalletAddress] = args;

    console.log(`Starting Force Refund (No DB Mode)`);
    console.log(`Vault: ${vaultAddress}`);
    console.log(`User:  ${userWalletAddress}`);

    try {
        if (!process.env.NEXT_PUBLIC_KEEPER_ADDRESS) {
            throw new Error("Missing NEXT_PUBLIC_KEEPER_ADDRESS in env");
        }
        
        const keeperAddress = Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS);
        const targetAddress = Address.parse(vaultAddress);
        const userAddress = Address.parse(userWalletAddress);

        console.log('Fetching Vault Balance...');
        const balanceNano = await getTonBalance(vaultAddress);
        const balanceTON = Number(balanceNano) / 1e9;
        console.log(`Balance: ${balanceTON} TON`);

        if (balanceTON < 0.1) {
            console.error('Insufficient balance to refund.');
            return;
        }

        // We assume we just want to sweep EVERYTHING to the user, minus fees.
        // We will simulate the logic from execution.ts but simplified.
        
        // 1. Reserve for gas/storage
        const reserveAmount = 0.15;
        // 2. Refund Keeper (0.05) - recurring
        // 3. We assume no "liquidation" needed (or user handles it). 
        // NOTE: If positions are open (storm/ston), this script WON'T close them. 
        // It blindly sweeps TON.
        
        // Check if we should warn about active positions?
        // We can't know without DB or checking contract state.
        console.warn('WARNING: This script only sweeps TON. It does NOT close Storm Trade positions!');

        const safeWithdrawAmount = balanceTON - reserveAmount; // - 0.05 for keeper is inside the message value? No.
        
        // The message structure in execution.ts:
        // Keeper Refund Msg (0.05)
        // Exit Messages (sweep)
        
        // If we send 0.05 to keeper from the vault, that reduces the vault balance.
        // So available for user = Balance - 0.05 - Reserve.

        const KEEPER_REFUND = 0.05;
        const availableForUser = balanceTON - reserveAmount - KEEPER_REFUND;
        
        console.log(`Estimated Sweep Amount: ~${availableForUser.toFixed(4)} TON`);

        if (availableForUser <= 0) {
            console.error('Balance too low after reserves.');
            return;
        }

        // Build Exit Tx (Fee + Sweep)
        // We don't know "Entry Value" here, so we assume 0 profit (no fee)? 
        // Or we ask user? 
        // For safety/emergency, we might skip Pamelo fee? 
        // Or we can just just sweep directly.
        
        // Let's use buildAtomicExitTx to be consistent, but passing 0 entry value might skip fee?
        // fees.ts: if profit <= 0 returns full amount.
        // So passing entryValue = Infinity would force 0 profit.
        // Passing entryValue = 0 would mean ALL is profit -> Max Fee.
        // Let's assume this is a "Panic" refund returning capital -> 0 fee? 
        // Let's pass entryValue = totalAmount (Break even).
        
        const { messages: exitMessages } = buildAtomicExitTx({
             userAddress: userWalletAddress,
             totalAmountTon: availableForUser,
             entryValueTon: availableForUser // Treat as break-even (no performance fee)
        });

        const rawMessages = [
            // Refund Keeper
            {
                to: keeperAddress,
                value: toNano('0.05'),
                body: beginCell().storeUint(0, 32).storeStringTail('Fee Refund: Manual Panic').endCell()
            },
            ...exitMessages.map((msg, index) => {
                 return {
                     to: msg.to,
                     value: msg.value,
                     body: msg.body,
                     // Make the last one CARRY_ALL to sweep dust
                     mode: index === exitMessages.length - 1 ? 128 : undefined 
                 };
            })
        ];

        console.log('Wrapping with Keeper Request...');
        const wrappedCell = await wrapWithKeeperRequest(targetAddress, rawMessages);

        const txs = [{
            address: targetAddress.toString(),
            value: '100000000', // 0.1 TON gas
            cell: wrappedCell.toBoc().toString('base64')
        }];

        console.log('Broadcasting Transaction...');
        const result = await firstValueFrom(sendTransactions$(txs));
        
        console.log('Transaction Sent!');
        console.log(`Seqno: ${result.seqno}`);
        console.log('Watch the vault explorer for movement.');

    } catch (e) {
        console.error('Failed:', e);
    }
}

main();
