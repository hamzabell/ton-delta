
import { NATIVE_MAINNET_SDKConfig } from '@storm-trade/sdk';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function main() {
    console.log("Checking SDK Config...");
    console.log(JSON.stringify(NATIVE_MAINNET_SDKConfig, null, 2));
}

main();
