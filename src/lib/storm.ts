/* eslint-disable */
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators'; // Keep rxjs for compat
import { 
    StormSDK, 
    NATIVE_MAINNET_SDKConfig, 
    Direction, 
    AssetInfo 
} from '@storm-trade/sdk';
import { Address, fromNano, toNano } from '@ton/core';
import { getTonClient, withRetry } from './onChain';

/**
 * Singleton StormSDK instance
 */
let _stormSDK: StormSDK | null = null;

const getStormSDK = async () => {
    if (_stormSDK) return _stormSDK;
    const client = await getTonClient(); // Reuse shared client
    // TODO: Switch config based on Env (Mainnet vs Testnet).
    // For now assuming Mainnet as per previous context (or make it configurable).
    // Using NATIVE_MAINNET_SDKConfig (TON collateral).
    _stormSDK = new StormSDK(client as any, NATIVE_MAINNET_SDKConfig); 
    return _stormSDK;
};

/**
 * Fetches the current mark price for a pair.
 */
export const getMarkPrice$ = (symbol: string): Observable<number> => {
    return from((async () => {
        try {
            const sdk = await getStormSDK();
            // Symbol in SDK is usually "TON", "BTC", etc.
            // If symbol is "TON-USDT", we need "TON".
            const baseAsset = symbol.split('-')[0].toUpperCase();
            
            // SDK returns bigint (nano), convert to number
            const priceNano = await withRetry(c => sdk.getMarketPrice(baseAsset));
            return Number(fromNano(priceNano));
        } catch (e: any) {
            console.error(`[StormSDK] Failed to get price for ${symbol}`, e.message);
            throw e;
        }
    })());
};

/**
 * Fetches the current funding rate.
 */
export const getFundingRate$ = (symbol: string): Observable<number> => {
    return from((async () => {
        try {
            const sdk = await getStormSDK();
            const baseAsset = symbol.split('-')[0].toUpperCase();
            const funding = await withRetry(c => sdk.getFunding(baseAsset));
            // Funding is likely returned as object { longFunding, shortFunding } (bigint)
            // For Short strategy, we want shortFunding. 
            // Note: need to verify normalization (decimals).
            // SDK funding is usually cumulative/rate? 
            // Assuming simplified rate for now.
            return Number(fromNano(funding.shortFunding)); 
        } catch (e: any) {
            console.error(`[StormSDK] Failed to get funding for ${symbol}`, e.message);
            throw e; // Fail safely, do not return mock 0
        }
    })());
};

/**
 * Builds the transaction payload to open a short position
 */
export const buildOpenPositionPayload = async (params: { vaultAddress: string, amount: string, leverage: number, symbol?: string }) => {
    const sdk = await getStormSDK();
    const baseAsset = params.symbol || 'TON';

    // 1x Short
    const txParams = await withRetry(c => sdk.increasePosition({
        baseAsset,
        amount: toNano(params.amount),
        leverage: toNano(params.leverage), // SDK expects leverage in 9 decimals? Types says "bigint". Examples usually use toNano(lev).
        direction: Direction.short,
        traderAddress: Address.parse(params.vaultAddress)
    }));

    return {
        to: txParams.to.toString(),
        value: txParams.value.toString(),
        body: txParams.body.toBoc().toString('base64')
    };
};

/**
 * Builds the transaction payload to close a short position (Partial or Full)
 */
export const buildClosePositionPayload = async (params: { vaultAddress: string, positionId: string, amount?: string, symbol?: string }) => {
    const sdk = await getStormSDK();
    const baseAsset = params.symbol || 'TON'; 

    // If amount is missing, we need to know the full size?
    // SDK `closePosition` requires `size`.
    // If we don't know the size, we can't close "Full" without fetching it first.
    // So we fetch it if amount is missing.
    
    let sizeToClose = params.amount ? toNano(params.amount) : BigInt(0);
    
    if (sizeToClose === BigInt(0)) {
        // Fetch full position
        const position = await withRetry(c => sdk.getPositionAccountData(Address.parse(params.vaultAddress), baseAsset));
        if (!position) throw new Error("No open position found to close");
        if (!position.shortPosition) throw new Error("No short position found to close");
        
        sizeToClose = position.shortPosition.positionData.size;
    }

    const txParams = await withRetry(c => sdk.closePosition({
        baseAsset,
        direction: Direction.short,
        traderAddress: Address.parse(params.vaultAddress),
        size: sizeToClose
    }));

    return {
        to: txParams.to.toString(),
        value: txParams.value.toString(),
        body: txParams.body.toBoc().toString('base64')
    };
};

/**
 * Builds transaction to Adjust Margin (Deposit/Withdraw)
 */
export const buildAdjustMarginPayload = async (params: { vaultAddress: string, amount: string, isDeposit: boolean, symbol?: string }) => {
    const sdk = await getStormSDK();

    let txParams;
    if (params.isDeposit) {
        txParams = await withRetry(c => sdk.addMargin({
            baseAsset: params.symbol || 'TON', // Allow override
            amount: toNano(params.amount),
            direction: Direction.short,
            traderAddress: Address.parse(params.vaultAddress)
        }));
    } else {
         txParams = await withRetry(c => sdk.removeMargin({
            baseAsset: params.symbol || 'TON',
            amount: toNano(params.amount),
            direction: Direction.short,
            traderAddress: Address.parse(params.vaultAddress)
        }));
    }

    return {
        to: txParams.to.toString(),
        value: txParams.value.toString(),
        body: txParams.body.toBoc().toString('base64')
    };
};

/**
 * Fetches the real on-chain position
 */
export const getPosition$ = (symbol: string, userAddress: string): Observable<{ amount: number, entryPrice: number }> => {
    return from((async () => {
        const sdk = await getStormSDK();
        const baseAsset = symbol.split('-')[0].toUpperCase();
        
        const posData = await withRetry(c => sdk.getPositionAccountData(Address.parse(userAddress), baseAsset));
        
        if (!posData || !posData.shortPosition) {
            // No position
            return { amount: 0, entryPrice: 0 };
        }

        const sizeNano = posData.shortPosition.positionData.size;
        const openNotionalNano = posData.shortPosition.positionData.openNotional;
        
        const size = Number(fromNano(sizeNano));
        const openNotional = Number(fromNano(openNotionalNano));
        
        // Entry Price = Open Notional / Size
        const entryPrice = size > 0 ? openNotional / size : 0;

        return {
            amount: size,
            entryPrice: entryPrice
        };
    })());
};
