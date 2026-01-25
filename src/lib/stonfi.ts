import { from, Observable } from 'rxjs';
import { StonApiClient } from '@ston-fi/api';
import { DEX } from '@ston-fi/sdk';
import { TonClient } from '@ton/ton';
import { getTonClient } from './onChain';
import { Address, toNano } from '@ton/core';

const client = new StonApiClient();

// Mainnet V2.1 Router (Default)
// Using constant from SDK if available, or fallback
const ROUTER_ADDRESS = 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt';
const PTON_ADDRESS = 'EQBnGWMCf3-FZZq1W4M6-RfpSTBtQS772H-100UIKsviP_84';

export const stonfi = {

    /**
     * Get Spot Price using Ston.fi API
     */
    getSpotPrice$: (baseToken: string, quoteToken: string): Observable<number> => {
        return from((async () => {
            try {
                // Resolve symbols to addresses
                const baseAddr = await stonfi.resolveTokenAddress(baseToken);
                const quoteAddr = await stonfi.resolveTokenAddress(quoteToken);

                if (!baseAddr || !quoteAddr) throw new Error(`Could not resolve tokens: ${baseToken}, ${quoteToken}`);

                // Fetch asset info for price in USD (simplification)
                // Ideal way: Get configured pool and check ratio.
                // Shortcut: Use Ston.fi Asset API which gives USD price.
                const baseAsset = await client.getAsset(baseAddr);
                const quoteAsset = await client.getAsset(quoteAddr);

                const basePrice = Number(baseAsset?.dexPriceUsd || 0);
                const quotePrice = Number(quoteAsset?.dexPriceUsd || 0);

                if (!basePrice || !quotePrice) return 0;

                return basePrice / quotePrice;
            } catch (e) {
                console.warn('[StonFi] Price fetch failed', e);
                return 0;
            }
        })());
    },

    /**
     * Resolves a token symbol (e.g. 'DOGS', 'TON') to its address using Ston.fi Asset List
     */
    resolveTokenAddress: async (symbol: string): Promise<string | null> => {
        const s = symbol.toUpperCase();
        // Hardcoded overrides
        if (s === 'TON') return PTON_ADDRESS;
        if (s === 'USDT') return 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixDn7Nx24_USDT';
        // Map DOGE to DOGS (assuming user intent or bridged) and provide address for DOGS
        if (s === 'DOGE' || s === 'DOGS') return 'EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS';
        if (s === 'NOT') return 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';
        
        // Search via API
        try {
            const results = await client.searchAssets({ searchString: symbol, condition: 'Contains' });
            const match = results.find(a => a.meta?.symbol?.toUpperCase() === symbol.toUpperCase());
            return match?.contractAddress || null;
        } catch (e) {
            console.warn(`[StonFi] Token resolution failed for ${symbol}`, e);
            return null;
        }
    },

    /**
     * Builds a Swap Transaction using Ston.fi SDK
     */
    buildSwapTx: async (params: {
        userWalletAddress: string;
        fromToken: string;
        toToken: string;
        amount: string; // TON amount (decimal string, e.g. "1.5")
        minOutput?: string;
    }) => {
        const provider = await getTonClient();
        
        // 1. Resolve Tokens
        const fromAddr = await stonfi.resolveTokenAddress(params.fromToken);
        const toAddr = await stonfi.resolveTokenAddress(params.toToken);

        if (!fromAddr || !toAddr) throw new Error(`Invalid tokens: ${params.fromToken} -> ${params.toToken}`);

        // 2. Initialize Router
        // We use V2.1 Router
        const router = new DEX.v2_1.Router(provider as any, {});

        const amountNano = toNano(params.amount);
        const userAddress = Address.parse(params.userWalletAddress);
        const minOut = params.minOutput ? BigInt(params.minOutput) : BigInt(1); // Default 1 unit if not specified (we rely on hardcoded slippage in query usually, but SDK handles it via queryId or limit)
        // Note: SDK build methods usually take minAskAmount.

        let txParams;
        if (params.fromToken.toUpperCase() === 'TON') {
            // TON -> Jetton
            txParams = await router.getSwapTonToJettonTxParams(provider as any, {
                userWalletAddress: userAddress,
                proxyTon: new DEX.v2_1.pTON(PTON_ADDRESS),
                offerAmount: amountNano,
                askJettonAddress: Address.parse(toAddr),
                minAskAmount: minOut,
                // queryId: ...
            });
        } else {
            // Jetton -> TON (or Jetton -> Jetton)
            // For Jetton -> TON, askToken is pTON, but we might want to unwrap?
            // Router handles proxyTonAddress for unwrap if askJettonAddress is pTON?
            // Actually, for V2, standard is swap Jetton->Jetton (where one is pTON).
            
            txParams = await router.getSwapJettonToJettonTxParams(provider as any, {
                userWalletAddress: userAddress,
                offerJettonAddress: Address.parse(fromAddr),
                askJettonAddress: Address.parse(toAddr),
                offerAmount: amountNano,
                minAskAmount: minOut,
                // For direct Jetton send, we need the user's jetton wallet.
                // The SDK helper `getSwapJettonToJettonTxParams` returns the payload to send to YOUR Jetton Wallet.
            });
        }

        // 3. Format result for ExecutionService ( { to, value, body } )
        // txParams returns { to: Address, value: bigint, body: Cell }
        return {
            to: txParams.to.toString(),
            value: txParams.value.toString(),
            body: txParams.body?.toBoc().toString('base64')
        };
    }
};
