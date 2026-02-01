import { from, Observable } from 'rxjs';
import { StonApiClient } from '@ston-fi/api';
import { DEX } from '@ston-fi/sdk';
import { TonClient } from '@ton/ton';
import { getTonClient } from './onChain';
import { Address, toNano, beginCell } from '@ton/core';
import { Logger } from '../services/logger';

const client = new StonApiClient();

// Mainnet V2.1 Router (Default)
// Using constant from SDK if available, or fallback
const ROUTER_ADDRESS = 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt';
// Mainnet pTON (proxy TON) address - used for TON swaps on Ston.fi
const PTON_ADDRESS = 'EQBbJjnahBMGbMUJwhAXLn8BiigcGXMJHSC0l7DBhdYABhG7';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let assetCache: { data: any[], timestamp: number } | null = null;
let ptonAddressCache: { address: string, timestamp: number } | null = null;


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
                // Match ticker (already defined above)
                // Helper to get price
                const getPrice = async (addr: string, symbol: string) => {
                    // Special handling for TON in Asset List
                    let searchAddr = addr;
                    if (symbol.toUpperCase() === 'TON') {
                        searchAddr = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
                    }

                    // 1. Try Cache first
                    if (assetCache) {
                        const cached = assetCache.data.find((a: any) => a.contract_address === searchAddr);
                        if (cached && cached.dexPriceUsd) return Number(cached.dexPriceUsd);
                    }
                    
                    // 2. Try Direct API
                    try {
                        const asset = await client.getAsset(searchAddr);
                        return Number(asset?.dexPriceUsd || 0);
                    } catch (e) {
                         // 3. Fallback: Search all assets
                         try {
                              if (!assetCache) console.log('Fetching all assets for fallback...');
                              const res = await fetch('https://api.ston.fi/v1/assets');
                              const data = await res.json();
                              const list = data.asset_list || [];
                              assetCache = { data: list, timestamp: Date.now() };
                              
                              const match = list.find((a: any) => a.contract_address === searchAddr);
                              return Number(match?.dexPriceUsd || 0);
                         } catch (err) {
                             return 0;
                         }
                    }
                };

                const basePrice = await getPrice(baseAddr, baseToken);
                const quotePrice = await getPrice(quoteAddr, quoteToken);

                if (!basePrice || !quotePrice) return 0;

                return basePrice / quotePrice;
            } catch (e) {
                console.warn('[StonFi] Price fetch failed', e);
                return 0;
            }
        })());
    },

    /**
     * Fetch pTON master address from Ston.fi API (cached)
     */
    getPtonAddress: async (): Promise<string> => {
        if (ptonAddressCache && (Date.now() - ptonAddressCache.timestamp < CACHE_TTL)) {
            return ptonAddressCache.address;
        }

        try {
            const res = await fetch('https://api.ston.fi/v1/routers');
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            
            const routers = await res.json();
            const routerInfo = routers.router_list?.[0];
            
            if (!routerInfo?.pton_master_address) {
                throw new Error('pTON master address not found in router info');
            }

            const ptonAddr = routerInfo.pton_master_address;
            ptonAddressCache = { address: ptonAddr, timestamp: Date.now() };
            Logger.info('StonFi', `Fetched pTON address: ${ptonAddr}`);
            return ptonAddr;
        } catch (e) {
            Logger.error('StonFi', 'Failed to fetch pTON address', '', { error: (e as Error).message });
            return 'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S';
        }
    },

    /**
     * Resolves a token symbol (e.g. 'DOGS', 'TON') to its address using Ston.fi Asset List
     */
    resolveTokenAddress: async (symbol: string): Promise<string | null> => {
        const s = symbol.toUpperCase();
        if (s === 'TON') return await stonfi.getPtonAddress();
        if (s === 'USDT') return 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixDn7Nx24_USDT';
        // Map DOGE to DOGS (assuming user intent or bridged) and provide address for DOGS
        if (s === 'DOGE' || s === 'DOGS') return 'EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS';
        if (s === 'CATI') return 'EQD-cvR0Nz6XAyRBvbhz-abTrRC6sI5tvHvvpeQraV9UAAD7';
        if (s === 'NOT') return 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';
        if (s === 'HMSTR') return 'EQAJ8uWd7EBqsmpIrimDA0eXd80GNYPd2NBsu326spn1H4Jj';
        if (s === 'STON') return 'EQA2kCVNwVsil2UM2mDgPc6V-RMl3qTlWessvPR67Act669b';
        if (s === 'REDO') return 'EQBZ_cafPyDr5KUTs0aNkfGaQS4YAdbR2LT98wgJOJgxHPNa';
        
        // Search via API
        Logger.info('StonFi', `Resolving via API: ${symbol}`);
        try {
            // Primary Method: Full Asset List (More reliable than search currently)
            // cache this if possible, but for now just fetch
            let assets: any[] = [];
            
            if (assetCache && (Date.now() - assetCache.timestamp < CACHE_TTL)) {
                assets = assetCache.data;
            } else {
                 const res = await fetch('https://api.ston.fi/v1/assets', { next: { revalidate: 3600 } } as any);
                 if (!res.ok) {
                     // Check if valid JSON error response to extract message?
                     // But for now just throw status
                     throw new Error(`Asset API error: ${res.status}`);
                 }
                 const data = await res.json();
                 assets = data.asset_list || [];
                 assetCache = { data: assets, timestamp: Date.now() };
            }
            
            const match = assets.find((a: any) => 
                a.symbol.toUpperCase() === symbol.toUpperCase() && !a.blacklisted
            );
            
            return match?.contract_address || null;

        } catch (e) {
            Logger.warn('StonFi', `Token resolution failed (API) for ${symbol}`, undefined, { error: String(e) });
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
        tokenAddress?: string; // Optional override to bypass resolution
    }) => {

        const provider = await getTonClient();
        
        // 1. Resolve Tokens (use resolveTokenAddress which handles TON via getPtonAddress)
        const fromAddr = params.tokenAddress && params.fromToken !== 'TON' 
            ? params.tokenAddress 
            : await stonfi.resolveTokenAddress(params.fromToken);
        
        const toAddr = params.tokenAddress && params.toToken !== 'TON' 
            ? params.tokenAddress 
            : await stonfi.resolveTokenAddress(params.toToken);

        if (!fromAddr || !toAddr) throw new Error(`Invalid tokens: ${params.fromToken} -> ${params.toToken}`);

        // 2. Initialize Router
        // We use V1 Router (Address corresponds to V1, V2.1 might not be mainnet or address unknown)
        const router = new DEX.v1.Router(ROUTER_ADDRESS, {});

        const amountNano = toNano(params.amount);
        const userAddress = Address.parse(params.userWalletAddress);
        const minOut = params.minOutput ? BigInt(params.minOutput) : BigInt(1); // Default 1 unit if not specified (we rely on hardcoded slippage in query usually, but SDK handles it via queryId or limit)
        // Note: SDK build methods usually take minAskAmount.

        let txParams;
        if (params.fromToken.toUpperCase() === 'TON') {
            // TON -> Jetton
            // Explicitly use the resolved Mainnet pTON address
            const ptonAddress = await stonfi.getPtonAddress();
            const proxyTon = new DEX.v1.pTON(ptonAddress);
            
            txParams = await router.getSwapTonToJettonTxParams(provider as any, {
                userWalletAddress: userAddress,
                proxyTon: proxyTon,
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
    },

    /**
     * Helper to get real Jetton Balance
     */
    getJettonBalance: async (userWalletAddress: string, tokenAddress: string): Promise<bigint> => {
        const client = await getTonClient();
        const userAddr = Address.parse(userWalletAddress);
        const tokenAddr = Address.parse(tokenAddress);
        
        try {
            // 1. Get Wallet Address
            const { stack } = await client.runMethod(tokenAddr, 'get_wallet_address', [
                { type: 'slice', cell: beginCell().storeAddress(userAddr).endCell() }
            ]);
            const jettonWalletAddr = stack.readAddress();
            
            // 2. Get Balance
            const { stack: walletStack } = await client.runMethod(jettonWalletAddr, 'get_wallet_data');
            return walletStack.readBigNumber();
        } catch (e) {
            return BigInt(0);
        }
    }
};
