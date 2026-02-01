
import { StormSDK, NATIVE_MAINNET_SDKConfig, Direction } from '@storm-trade/sdk';
import { getTonClient } from '../lib/onChain';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { Address, toNano } from '@ton/core';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const VAULT = 'EQBT9_8w6KM_rN3OcwmlYDgcFLUW2MvL03hYHQBXJz4TFmsK';
const SYMBOL = 'DOGS';

async function main() {
    console.log("Debugging createOrder...");
    const client = await getTonClient();
    const sdk = new StormSDK(client as any, NATIVE_MAINNET_SDKConfig);

    const asset = await sdk.getAssetInfoByName(SYMBOL);
    const vamm = await sdk.getAmmAddress(asset.index);
    const pos = await sdk.getPositionAddress(Address.parse(VAULT), vamm);
    
    console.log("Position:", pos.toString());
    
    // Test Values
    const amount = toNano('0.71');
    const leverage = toNano('1'); // 1x = 1e9

    console.log(`Calling createOrder with amount=${amount} (BigInt), lev=${leverage} (BigInt)`);

    try {
        const tx = await sdk.createOrder({
            orderType: 'market',
            direction: Direction.short,
            baseAsset: SYMBOL,
            amount: amount,
            leverage: leverage,
            expiration: 0,
            limitPrice: toNano('0'),        // CORRECT KEY
            stopTriggerPrice: toNano('0'),  // CORRECT KEY 
            takeTriggerPrice: toNano('0'),  // CORRECT KEY
            traderAddress: Address.parse(VAULT),
            positionAddress: pos
        } as any);
        
        console.log("Success!");
    } catch (e) {
        console.error("Crash reproduce:", e);
    }
}

main();
