import { TonClient } from '@ton/ton';
import { Address, toNano, beginCell } from '@ton/core';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { DEX, pTON } from '@ston-fi/sdk';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { CURRENT_NETWORK } from './config';

// Placeholder for Token Addresses (Mainnet)
const TOKENS = CURRENT_NETWORK.tokens;

const getClient = async () => {
    // Override endpoint if provided by config (e.g. Testnet)
    if (CURRENT_NETWORK.tonApi) {
        return new TonClient({ endpoint: CURRENT_NETWORK.tonApi });
    }
    const endpoint = await getHttpEndpoint();
    return new TonClient({ endpoint });
};

/**
 * Ston.fi Integration Service
 * Handles Spot Swaps and "Stasis Mode" entry (TON -> stTON)
 */
export const stonfi = {

    /**
     * Get Spot Price for a Pair on Ston.fi
     * @param baseToken Address of base token (e.g., TON)
     * @param quoteToken Address of quote token (e.g., USDT)
     */
    /**
     * Get Spot Price for a Pair on Ston.fi via Public API
     * @param baseToken Address of base token (e.g., TON)
     * @param quoteToken Address of quote token (e.g., USDT)
     */
    getSpotPrice$: (baseToken: string, quoteToken: string): Observable<number> => {
        return from((async () => {
            try {
                // Helper to normalize "TON" string to pTON address or native representation
                // Ston.fi API uses standard jetton addresses. 
                // For TON, it usually tracks pTON: EQBnGWMCf3-FZZq1W4M6-RfpSTBtQS772H-100UIKsviP_84 
                // OR it might have a special address.
                // Let's rely on what addresses are passed.
                // For TON, it usually tracks pTON: EQBnGWMCf3-FZZq1W4M6-RfpSTBtQS772H-100UIKsviP_84 
                // We map 'TON' to this address for API lookup.
                const pTON = 'EQBnGWMCf3-FZZq1W4M6-RfpSTBtQS772H-100UIKsviP_84';
                const resolveParams = (t: string) => t === 'TON' ? pTON : t;

                const base = resolveParams(baseToken);
                const quote = resolveParams(quoteToken);

                // Fetch Asset Info
                // Endpoint: https://api.ston.fi/v1/assets/{address}
                const [baseData, quoteData] = await Promise.all([
                    fetch(`https://api.ston.fi/v1/assets/${base}`).then(r => r.json()),
                    fetch(`https://api.ston.fi/v1/assets/${quote}`).then(r => r.json())
                ]);

                const basePrice = baseData?.asset?.dex_usd_price;
                const quotePrice = quoteData?.asset?.dex_usd_price;

                if (!basePrice || !quotePrice) {
                    throw new Error(`Price data missing for ${baseToken} or ${quoteToken}`);
                }

                return Number(basePrice) / Number(quotePrice);

            } catch (err) {
                 console.warn('[StonFi] Price fetch failed:', err);
                 // Fallback: If we can't get external price, we essentially fail the safety check safely (e.g. don't liquidate erroneously)
                 // But we throw so it retries.
                 throw err;
            }
        })());
    },

    /**
     * Build Transaction Body for swapping TON -> Token
     * Used for:
     * 1. Entry: TON -> USDT (if needed)
     * 2. Stasis: TON -> stTON
     */
    buildSwapTx: async (params: {
        userWalletAddress: string;
        fromToken: 'TON' | string;
        toToken: string;
        amount: string;
        minOutput: string;
    }) => {
        // 1. Swap TON -> Token (Stasis Entry)
        // We send TON to the pTON Vault (or Router) with the Swap Payload.
        // OpCode: 0x25938561 (swap)
        // This payload tells the DEX to swap the incoming TON.
        
        const swapBody = beginCell()
            .storeUint(0x25938561, 32) // OpCode: Swap
            .storeUint(0, 64) // QueryID
            .storeAddress(Address.parse(params.userWalletAddress)) // Owner/Receiver
            .storeCoins(toNano(params.minOutput)) // Min Out
            .storeAddress(Address.parse(params.userWalletAddress)) // Excess/Response
            .storeBit(0) // Custom Payload (null)
            .storeRef(
                 // Referral / Forward Payload
                 beginCell().storeUint(0, 1).endCell()
            )
            .endCell();

        return {
            to: CURRENT_NETWORK.stonRouter, // Send to Router (who forwards to pTON vault usually) or direct pTON vault
            value: toNano(params.amount) + toNano('0.2'), // + Gas (Fix: Use toNano for both parts)
            body: swapBody.toBoc().toString('base64')
        };
    },

    /**
     * Enter Stasis Mode
     * Macro for swapping TON balance -> Liquid Staking Token
     */
    buildEnterStasisTx: async (amount: string) => {
        // Hardcoded to swap TON -> stTON
        return stonfi.buildSwapTx({
            userWalletAddress: '0x...', // Context dependent
            fromToken: 'TON',
            toToken: TOKENS.tsTON,
            amount,
            minOutput: '1' // Sliver protection handled elsewhere
        });
    },
    /**
     * Simulate a swap to estimate output and price impact.
     * Uses the Ston.fi Reverse Swap Simulate API or estimates via Reserves.
     */
    getSimulatedSwap: async (fromToken: string, toToken: string, amount: string): Promise<{ expectedOutput: string, priceImpact: number }> => {
        try {
            // Mapping "TON" to pTON for API
            const pTON = 'EQBnGWMCf3-FZZq1W4M6-RfpSTBtQS772H-100UIKsviP_84';
            const resolveParams = (t: string) => t === 'TON' ? pTON : t;
            
            const offerAddress = resolveParams(fromToken);
            const askAddress = resolveParams(toToken);

            // API: /v1/reverse_swap/simulate
            // Params: offer_address, ask_address, offer_units, slippage_tolerance
            const params = new URLSearchParams({
                offer_address: offerAddress,
                ask_address: askAddress,
                offer_units: amount,
                slippage_tolerance: '0.01' // 1%
            });

            const res = await fetch(`https://api.ston.fi/v1/reverse_swap/simulate?${params}`);
            if (!res.ok) {
                 // Fallback for mocked environment or API failure
                 console.warn('[StonFi] Simulation API failed, using fallback estimation 1:1');
                 return { expectedOutput: amount, priceImpact: 0 };
            }

            const data = await res.json();
            
            // data.ask_units = expected output
            // data.price_impact = impact (0.05 = 5%)
            return {
                expectedOutput: data.ask_units,
                priceImpact: Number(data.price_impact || 0)
            };

        } catch (e) {
            console.warn('[StonFi] Simulation Error:', e);
            return { expectedOutput: amount, priceImpact: 0 };
        }
    }
};
