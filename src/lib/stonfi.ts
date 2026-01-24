import { from, Observable } from 'rxjs';
import { CURRENT_NETWORK } from './config';

/**
 * Ston.fi REST Service
 * Handles Spot Price fetching and simulation via Public REST API.
 * This file no longer uses the @ston-fi/sdk and only interacts with Public APIs.
 */
export const stonfi = {

    /**
     * Get Spot Price for a Pair on Ston.fi via Public API
     * @param baseToken Address of base token (e.g., TON)
     * @param quoteToken Address of quote token (e.g., USDT)
     */
    getSpotPrice$: (baseToken: string, quoteToken: string): Observable<number> => {
        return from((async () => {
            try {
                // Helper to normalize "TON" string to pTON address
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
                 throw err;
            }
        })());
    },

    /**
     * Simulate a swap to estimate output and price impact.
     * Uses the Ston.fi Reverse Swap Simulate API.
     */
    getSimulatedSwap: async (fromToken: string, toToken: string, amount: string): Promise<{ expectedOutput: string, priceImpact: number }> => {
        try {
            // Mapping "TON" to pTON for API
            const pTON = 'EQBnGWMCf3-FZZq1W4M6-RfpSTBtQS772H-100UIKsviP_84';
            const resolveParams = (t: string) => t === 'TON' ? pTON : t;
            
            const offerAddress = resolveParams(fromToken);
            const askAddress = resolveParams(toToken);

            const params = new URLSearchParams({
                offer_address: offerAddress,
                ask_address: askAddress,
                offer_units: amount,
                slippage_tolerance: '0.01' // 1%
            });

            const res = await fetch(`https://api.ston.fi/v1/reverse_swap/simulate?${params}`);
            if (!res.ok) {
                 console.warn('[StonFi] Simulation API failed, using fallback estimation 1:1');
                 return { expectedOutput: amount, priceImpact: 0 };
            }

            const data = await res.json();
            
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
