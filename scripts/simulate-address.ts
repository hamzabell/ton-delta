
import { Address } from '@ton/core';

async function main() {
    console.log('--- Simulating Address Comparison ---');

    const dbStoredAddress = "0:79d98f1843421282988439e347f74959e681b5967e189f3c4cd99b82cea02333";
    const txSenderAddress = "EQB52Y8YQ0ISgpiEOeNH90lZ5oG1ln4YnzxM2ZuCzqAjM2k9"; // The one seen in debug transaction

    console.log(`DB (Raw): ${dbStoredAddress}`);
    console.log(`TX (Friendly): ${txSenderAddress}`);

    // This is the logic I added to keeper-monitor.ts
    let isOwner = false;
    try {
        const dbOwner = Address.parse(dbStoredAddress);
        const sender = Address.parse(txSenderAddress);
        
        console.log(`DB Friendly: ${dbOwner.toString()}`);
        console.log(`Sender Friendly: ${sender.toString()}`);

        if (dbOwner.equals(sender)) {
            isOwner = true;
            console.log('✅ Address.equals() passed!');
        } else {
            console.log('❌ Address.equals() failed!');
        }
    } catch (e) {
         console.log('Error parsing addresses: ', e);
         // Fallback to string check
         if ((dbStoredAddress as string) === txSenderAddress) isOwner = true;
    }

    console.log(`Final isOwner: ${isOwner}`);
    
    // Check old logic failure
    console.log(`\n--- Old Logic Check ---`);
    console.log(`String Equality (${dbStoredAddress} === ${txSenderAddress}): ${(dbStoredAddress as string) === txSenderAddress}`);
    console.log('This confirms why it was failing before.');
}

main();
