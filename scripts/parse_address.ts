
import { Address } from '@ton/core';

const walletStr = 'UQB52Y8YQ0ISgpiEOeNH90lZ5oG1ln4YnzxM2ZuCzqAjMzT4';
try {
    const addr = Address.parse(walletStr);
    console.log(`Input: ${walletStr}`);
    console.log(`Raw Hex: ${addr.toRawString()}`);
    console.log(`Workchain: ${addr.workChain}`);
    console.log(`Hash (Hex): ${addr.hash.toString('hex')}`);
    console.log(`Bounceable: ${addr.toString({ bounceable: true })}`);
    console.log(`Non-bounceable: ${addr.toString({ bounceable: false })}`);
} catch (e) {
    console.error(`Failed to parse: ${walletStr}`, e);
}
