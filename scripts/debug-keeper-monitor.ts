
import { getTonClient, withRetry } from '../src/lib/onChain';
import { Address, fromNano } from '@ton/core';
import dotenv from 'dotenv';

dotenv.config();

const KEEPER_ADDRESS = process.env.NEXT_PUBLIC_KEEPER_ADDRESS;

async function debugKeeperMonitor() {
    if (!KEEPER_ADDRESS) {
        console.error('❌ NEXT_PUBLIC_KEEPER_ADDRESS not set in .env');
        return;
    }

    console.log(`🔍 Inspecting Keeper Transactions for: ${KEEPER_ADDRESS}`);
    
    try {
        const client = await getTonClient();
        console.log(`✅ Connected to RPC: ${(client as any).parameters?.endpoint || 'default'}`);

        const transactions = await withRetry(c => c.getTransactions(Address.parse(KEEPER_ADDRESS), { limit: 20 }));
        console.log(`📦 Fetched ${transactions.length} recent transactions`);

        for (const [i, tx] of transactions.entries()) {
            console.log(`\n--- Transaction #${i + 1} [${tx.lt}] ---`);
            
            if (!tx.inMessage || tx.inMessage.info.type !== 'internal') {
                console.log('Skipping: Not an internal incoming message');
                continue;
            }

            const valueNano = tx.inMessage.info.value.coins;
            const valueTON = Number(fromNano(valueNano));
            const sender = tx.inMessage.info.src;
            
            console.log(`Sender: ${sender}`);
            console.log(`Value: ${valueTON} TON`);

            const body = tx.inMessage.body; // Cell
            console.log(`Body Hex: ${body.toBoc().toString('hex')}`);

            // Logic Simulation
            let comment = '';
            try {
                // Try opcode 0 parsing
                let slice = body.beginParse();
                if (slice.remainingBits >= 32) {
                    const opcode = slice.loadUint(32);
                    console.log(`Opcode: ${opcode}`);
                    
                    if (opcode === 0) {
                        comment = slice.loadStringTail();
                        console.log(`Parsed (Opcode 0): "${comment}"`);
                    } else {
                         // Try raw string (no opcode) fallback
                        console.log('Opcode not 0. Trying raw string parse...');
                        slice = body.beginParse();
                         try {
                            comment = slice.loadStringTail();
                            console.log(`Parsed (Raw): "${comment}"`);
                         } catch (e) {
                             console.log('Raw parse failed');
                         }
                    }
                } else {
                     console.log('Body too short for opcode');
                }
            } catch (e) {
                console.error('Parsing Error:', e);
            }

            const isRefund = comment.toLowerCase().includes('refund');
            const isValueMatch = valueTON >= 0.045; // Using the WIDENED tolerance
            
            console.log(`Is "refund" in comment? ${isRefund}`);
            console.log(`Is value >= 0.045? ${isValueMatch}`);
            
            if (isRefund && isValueMatch) {
                console.log('✅ WOULD TRIGGER REFUND logic!');
            } else {
                console.log('❌ Would NOT trigger.');
            }
        }

    } catch (e) {
        console.error('Debug Script Failed:', e);
    }
}

debugKeeperMonitor();
