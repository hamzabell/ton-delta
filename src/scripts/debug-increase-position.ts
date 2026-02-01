
import { StormSDK, NATIVE_MAINNET_SDKConfig, Direction } from '@storm-trade/sdk';
import { getTonClient } from '../lib/onChain';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { Address, toNano } from '@ton/core';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const VAULT = 'EQBT9_8w6KM_rN3OcwmlYDgcFLUW2MvL03hYHQBXJz4TFmsK';
const SYMBOL = 'DOGS';

async function main() {
    console.log("Debugging increasePosition...");
    const client = await getTonClient();
    const sdk = new StormSDK(client as any, NATIVE_MAINNET_SDKConfig);

    const asset = await sdk.getAssetInfoByName(SYMBOL);
    // const vamm = await sdk.getAmmAddress(asset.index);
    
    // Test Values
    const amount = toNano('0.71');
    const leverage = toNano('1');

    console.log(`Calling increasePosition with amount=${amount}, lev=${leverage}`);

    try {
        const tx = await sdk.increasePosition({
            baseAsset: SYMBOL,
            amount,
            leverage,
            direction: Direction.short,
            traderAddress: Address.parse(VAULT)
        });
        
        console.log("Success!");
        console.log("To:", tx.to.toString());
        console.log("Value:", tx.value.toString());
        
    } catch (e) {
        console.error("Crash reproduce:", e);
    }
}

main();
