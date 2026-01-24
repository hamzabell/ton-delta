import { Address, beginCell, Cell, toNano } from '@ton/core';
import { API_CONFIG } from './constants';

export const swapcoffee = {
    /**
     * Get a quote for a swap.
     */
    getQuote: async (fromToken: string, toToken: string, amountNano: string) => {
        const params = new URLSearchParams({
            from_token: fromToken === 'TON' ? 'ton' : fromToken,
            to_token: toToken === 'TON' ? 'ton' : toToken,
            amount: amountNano,
        });

        const res = await fetch(`${API_CONFIG.swapCoffee.baseUrl}/quote?${params}`);
        if (!res.ok) {
            throw new Error(`Swap Coffee Quote Failed: ${res.statusText}`);
        }
        return res.json();
    },

    /**
     * Build a swap transaction payload.
     */
    buildSwapTx: async (params: {
        userWalletAddress: string;
        fromToken: string;
        toToken: string;
        amount: string; // TON amount (not nano)
        minOutput?: string;
    }) => {
        const amountNano = toNano(params.amount).toString();
        const fromToken = params.fromToken === 'TON' ? 'ton' : params.fromToken;
        const toToken = params.toToken === 'TON' ? 'ton' : params.toToken;

        const body = {
            from_token: fromToken,
            to_token: toToken,
            amount: amountNano,
            address: params.userWalletAddress,
            slippage: '0.01', // 1%
        };

        const res = await fetch(`${API_CONFIG.swapCoffee.baseUrl}/swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Swap Coffee Build Failed: ${err.message || res.statusText}`);
        }

        const data = await res.json();
        
        // Swap Coffee returns back a structure with the BOC and target address
        // We need to parse their response. Assuming standard { to, value, body_boc }
        return {
            to: data.to || data.address,
            value: data.value || (params.fromToken === 'TON' ? amountNano : '200000000'), // At least gas if jetton
            body: data.body_boc || data.body
        };
    },

    /**
     * Fetch list of supported tokens.
     */
    fetchTokens: async () => {
        const res = await fetch(`${API_CONFIG.swapCoffee.baseUrl}/tokens`);
        if (!res.ok) throw new Error("Failed to fetch Swap Coffee tokens");
        return res.json();
    }
};
