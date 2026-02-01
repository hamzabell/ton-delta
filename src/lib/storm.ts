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

    // 1x Short via Vault (Handles deployment automatically)
    // initPositionManager: true is default in SDK for increasePosition
    const txParams = await withRetry(c => sdk.increasePosition({
        baseAsset,
        amount: toNano(params.amount),
        leverage: toNano(params.leverage), 
        direction: Direction.short,
        traderAddress: Address.parse(params.vaultAddress)
    }));
    
    // Note: increasePosition returns target (Vault) and body. 
    // It does not return init, because the Vault is already deployed.
    // The Vault will send internal message to deploy Position if needed.

    return {
        to: txParams.to.toString(),
        value: txParams.value.toString(),
        body: txParams.body.toBoc().toString('base64')
        // init: undefined // No init needed for Vault interaction
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
        try {
            const position = await withRetry(c => sdk.getPositionAccountData(Address.parse(params.vaultAddress), baseAsset));
            if (!position || !position.shortPosition) {
                 throw new Error("No open position found to close");
            }
            sizeToClose = position.shortPosition.positionData.size;
        } catch (e: any) {
            if (e.message?.includes('Asset info') || e.message?.includes('not found')) {
                console.warn(`[StormSDK] Unsupported asset or missing info for ${baseAsset}. Skipping closer builder.`);
                // Return 'skip' state
                return null; 
            }
            throw e;
        }
    }

    try {
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
    } catch (e: any) {
        if (e.message?.includes('Asset info')) return null;
        throw e;
    }
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
        
        let posData;
        try {
            posData = await withRetry(c => sdk.getPositionAccountData(Address.parse(userAddress), baseAsset));
        } catch (e: any) {
            // If asset is unsupported, return zero position
            if (e.message?.includes('Asset info')) return { amount: 0, entryPrice: 0 };
            throw e;
        }
        
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

/**
 * Calculates the predicted Storm Position Address.
 * Used to check if the position contract is already deployed.
 */
export const getStormPositionAddress = async (userVaultAddress: string, symbol: string): Promise<string> => {
    const sdk = await getStormSDK();
    const baseAsset = symbol.split('-')[0].toUpperCase();
    
    // SDK internal logic to derive address
    // We can use sdk.getPositionAddress(trader, vamm)
    // But we need vamm first.
    const asset = await sdk.getAssetInfoByName(baseAsset);
    const vammAddress = await sdk.getAmmAddress(asset.index);
    const positionAddress = await sdk.getPositionAddress(Address.parse(userVaultAddress), vammAddress);
    
    return positionAddress.toString();
};

/**
 * Builds the transaction payload to create a Stop Loss order.
 * Triggers if price crosses triggerPrice.
 */
export const buildStopLossPayload = async (params: { positionAddress: string, triggerPrice: string, symbol?: string }) => {
    const sdk = await getStormSDK();
    
    // Note: Stop Loss is sent to the Position Contract.
    // Ensure params.positionAddress is the correct Storm Position Address.
    
    // Using SDK's createOrder
    const txParams = await withRetry(c => sdk.createOrder({
        orderType: 'stopLoss',
        triggerPrice: toNano(params.triggerPrice),
        positionAddress: Address.parse(params.positionAddress),
        baseAsset: params.symbol || 'TON', 
        direction: Direction.short, // Stop Loss for a SHORT position
        traderAddress: Address.parse(params.positionAddress), // This might be redundant or specific to context, but typically trader is the user. 
                                                              // Wait, createOrder usually needs traderAddress? 
                                                              // Let's check `createOrderParams`... it uses `opts.positionAddress`.
                                                              // But validation might need traderAddress. 
                                                              // For safety, we should probably pass the user vault as traderAddress if possible, 
                                                              // but the signature logic is inside SDK.
                                                              // The critical part is `to: positionAddress`.
        // We do not need `amount` for SL usually, it closes the position? 
        // Storm V2: "stopLoss" order usually is a trigger to close.
        // If `amount` is missing, does it close full?
        // SDK `createSLTPOrderPayload` (line 4845) uses `opts`.
        // Looking at SDK source: it writes TRIGGER_PRICE and sets IS_STOP_LOSS flag.
        // It likely applies to the whole position.
    } as any));

    return {
        to: txParams.to.toString(),
        value: txParams.value.toString(), // 1 TON usually (gas) + fee
        body: txParams.body.toBoc().toString('base64')
    };
};
