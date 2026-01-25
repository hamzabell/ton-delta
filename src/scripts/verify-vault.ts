import 'dotenv/config';
import { Address, TupleBuilder } from '@ton/core';
import { TonClient } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

async function checkExtensions() {
    const vaultAddrStr = 'UQDVyC4YBHIy_vqwPJiWptFhlpUf6oNtfFyLGyTf7X11F6Ri';
    const keeperAddrStr = 'EQAAjMJ8IwIvXo1HdWUSuJLMeEkmhd18KfhKwRalBLvxYfQD';

    const endpoint = await getHttpEndpoint({ network: 'mainnet' });
    const client = new TonClient({ endpoint });

    console.log(`Checking extensions for Vault: ${vaultAddrStr}`);
    
    try {
        const result = await client.runMethod(Address.parse(vaultAddrStr), 'get_extensions');
        const stack = result.stack;
        
        const cell = stack.readCell();
        console.log('Extensions Cell found.');
        
        const { Dictionary } = await import("@ton/core");
        const dict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigInt(1), cell);
        
        const keeperAddress = Address.parse(keeperAddrStr);
        const keeperHash = BigInt("0x" + keeperAddress.hash.toString('hex'));
        console.log(`Searching for Keeper Hash: ${keeperHash.toString(16)}`);
        
        const exists = dict.get(keeperHash);
        if (exists) {
            console.log('✅ Keeper IS an authorized extension.');
        } else {
            console.log('❌ Keeper is NOT an authorized extension.');
            console.log('Authorized extensions:');
            for (const key of dict.keys()) {
                console.log(` - ${key.toString(16)}`);
            }
        }
        
    } catch (e) {
        console.error('Failed to run get_extensions:', e);
    }
}

checkExtensions();
