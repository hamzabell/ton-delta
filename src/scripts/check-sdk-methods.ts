
import { StormSDK, NATIVE_MAINNET_SDKConfig } from '@storm-trade/sdk';
import { getTonClient } from '../lib/onChain';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function main() {
    console.log("Checking SDK methods...");
    const client = await getTonClient();
    const sdk = new StormSDK(client as any, NATIVE_MAINNET_SDKConfig);

    console.log("Has getPositionStateInit?", typeof (sdk as any).getPositionStateInit); // Check if exists
    console.log("Has createOrder?", typeof (sdk as any).createOrder);
    
    // Check prototype if needed
    console.log("Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(sdk)));
}

main();
