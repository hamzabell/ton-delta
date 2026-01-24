import { TonClient } from '@ton/ton';
import { Address, beginCell } from '@ton/core';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { CURRENT_NETWORK } from './config'; // Adjust path if needed

let client: TonClient | null = null;

export const getTonClient = async () => {
    if (client) return client;
    
    // Use config endpoint or fallback to public
    const endpoint = CURRENT_NETWORK.tonApi || await getHttpEndpoint();
    client = new TonClient({ endpoint });
    return client;
};

export const getTonBalance = async (address: string): Promise<bigint> => {
    const c = await getTonClient();
    return c.getBalance(Address.parse(address));
};

export const getJettonWalletAddress = async (minterAddress: string, ownerAddress: string): Promise<Address> => {
    const client = await getTonClient();
    const minter = Address.parse(minterAddress);
    const owner = Address.parse(ownerAddress);
    
    // Run 'get_wallet_address' method on Minter
    const result = await client.callGetMethod(minter, 'get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(owner).endCell() }
    ]);
    
    return result.stack.readAddress();
};

export const getJettonBalance = async (minterAddress: string, ownerAddress: string): Promise<bigint> => {
    const client = await getTonClient();
    const jettonWallet = await getJettonWalletAddress(minterAddress, ownerAddress);
    
    const result = await client.callGetMethod(jettonWallet, 'get_wallet_data');
    return result.stack.readBigNumber();
};
