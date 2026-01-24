import { TonClient } from '@ton/ton';
import { Address, beginCell } from '@ton/core';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { CURRENT_NETWORK } from './config'; // Adjust path if needed

let client: TonClient | null = null;
let clientEndpoint: string | null = null;

const SLEEP_MS = 1000;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getTonClient = async (forceNew = false) => {
    if (client && !forceNew) return client;
    
    // Attempt with configuration endpoint first
    let endpoint = CURRENT_NETWORK.tonApi;
    
    if (!endpoint) {
        try {
            endpoint = await getHttpEndpoint();
        } catch (e) {
            console.error('[onChain] Failed to get TON HTTP endpoint:', e);
            // Fallback to public backup if ton-access fails
            endpoint = 'https://toncenter.com/api/v2/jsonRPC';
        }
    }

    clientEndpoint = endpoint;
    client = new TonClient({ endpoint });
    return client;
};

/**
 * Executes a TON Client operation with automatic retries on 429
 */
export const withRetry = async <T>(fn: (c: TonClient) => Promise<T>, maxRetries = 3): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const c = await getTonClient();
            return await fn(c);
        } catch (error: any) {
            lastError = error;
            const is429 = error?.response?.status === 429 || error?.message?.includes('429');
            
            if (is429) {
                console.warn(`[onChain] Rate limit hit (429). Retry ${i+1}/${maxRetries} after ${SLEEP_MS}ms...`);
                await sleep(SLEEP_MS * (i + 1)); // Exponential-ish backoff
                // On 429, try to force a new client/endpoint refresh
                await getTonClient(true);
            } else {
                throw error; // If not 429, throw immediately
            }
        }
    }
    throw lastError;
};

export const getTonBalance = async (address: string): Promise<bigint> => {
    return withRetry(c => c.getBalance(Address.parse(address)));
};

export const getJettonWalletAddress = async (minterAddress: string, ownerAddress: string): Promise<Address> => {
    return withRetry(async (client) => {
        const minter = Address.parse(minterAddress);
        const owner = Address.parse(ownerAddress);
        const result = await client.callGetMethod(minter, 'get_wallet_address', [
            { type: 'slice', cell: beginCell().storeAddress(owner).endCell() }
        ]);
        return result.stack.readAddress();
    });
};

export const getJettonBalance = async (minterAddress: string, ownerAddress: string): Promise<bigint> => {
    return withRetry(async (client) => {
        const jettonWallet = await getJettonWalletAddress(minterAddress, ownerAddress);
        const result = await client.callGetMethod(jettonWallet, 'get_wallet_data');
        return result.stack.readBigNumber();
    });
};
