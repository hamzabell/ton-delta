
import { StormSDK, NATIVE_MAINNET_SDKConfig } from '@storm-trade/sdk';
import { getTonClient, getTonBalance } from '../lib/onChain';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { Address, fromNano } from '@ton/core';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const SYMBOL = 'PNUT';
const VAULT_ADDRESS = 'EQCqUcaw0nQ1MVn5OuzXV3yEzlxnxquzyJREJOnfsHYewYIQ'; // pnut-ton vault

async function main() {
    console.log(`Checking Position Address for ${SYMBOL}...`);
    const client = await getTonClient();
    const sdk = new StormSDK(client as any, NATIVE_MAINNET_SDKConfig);

    try {
        const asset = await sdk.getAssetInfoByName(SYMBOL);
        console.log(`Asset Index: ${asset.index}`);
        const vammAddress = await sdk.getAmmAddress(asset.index);
        
        const positionAddress = await sdk.getPositionAddress(Address.parse(VAULT_ADDRESS), vammAddress);
        console.log(`Calculated Position Address: ${positionAddress.toString()}`);

        const bal = await getTonBalance(positionAddress.toString());
        console.log(`Position Contract Balance: ${fromNano(bal)} TON`);

    } catch (e) {
        console.error(e);
    }
}

main();
