
import { getTonBalance } from '../lib/onChain';
import { fromNano } from '@ton/core';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const VAULT = 'UQCqUcaw0nQ1MVn5OuzXV3yEzlxnxquzyJREJOnfsHYewd_V'; // From User Link (adjusted to raw if needed, checking UQC vs EQC is fine, library handles it)

async function main() {
    console.log(`Checking balance for ${VAULT}...`);
    try {
        const bal = await getTonBalance(VAULT);
        console.log(`Balance: ${fromNano(bal)} TON`);
    } catch (e) {
        console.error(e);
    }
}
main();
