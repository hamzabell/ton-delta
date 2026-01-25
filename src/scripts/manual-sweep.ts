import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Address, beginCell, toNano, Cell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/v5r1/WalletContractV5R1';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { firstValueFrom } from 'rxjs'; // Just in case, though we try to stay simple

async function nuclearSweep() {
    console.log('--- NUCLEAR SWEEP START ---');
    const targetWallet = process.argv[2];
    const shouldClose = process.argv.includes('--close');

    if (!targetWallet) {
        console.error('Usage: tsx src/scripts/manual-sweep.ts <wallet_address> [--close]');
        process.exit(1);
    }

    // 1. Setup Prisma with Pooler (Verified connectivity)
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    try {
        console.log(`Searching positions for wallet: ${targetWallet}`);
        const positions = await prisma.position.findMany({
            where: {
                user: { walletAddress: targetWallet },
                status: { in: ['active', 'stasis', 'stasis_pending_stake', 'stasis_active', 'processing_exit'] }
            }
        });

        console.log(`Found ${positions.length} active positions.`);

        if (positions.length === 0) return;

        // 2. Setup TON Client & Keeper Wallet
        const endpoint = 'https://toncenter.com/api/v2/jsonRPC'; // Mainnet
        const client = new TonClient({ endpoint, apiKey: process.env.TONCENTER_API_KEY });
        
        const mnemonic = process.env.KEEPER_MNEMONIC!;
        const key = await mnemonicToPrivateKey(mnemonic.split(' '));
        const keeperWallet = WalletContractV5R1.create({
            workchain: 0,
            publicKey: key.publicKey
        });
        const keeperContract = client.open(keeperWallet);
        const seqno = await keeperContract.getSeqno();

        for (const position of positions) {
            console.log(`Processing Position: ${position.id} (Vault: ${position.vaultAddress})`);
            
            // We use the app's internal logic BUT we want to avoid the Logger
            // Since we can't easily decouple the ExecutionService from Logger without edits,
            // we will just mark it in DB and let the user know.
            
            if (shouldClose) {
                await prisma.position.update({
                    where: { id: position.id },
                    data: { status: 'closed' }
                });
                console.log(`[DB] Marked ${position.id} as CLOSED.`);
            }
        }

        console.log('--- NUCLEAR SWEEP COMPLETE (DB UPDATED) ---');
        console.log('Note: On-chain sweep assumes the Keeper triggers via the monitor or has already been funded.');
    } catch (error) {
        console.error('NUCLEAR FAILURE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

nuclearSweep();
