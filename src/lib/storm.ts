import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import axios from 'axios';

import { CURRENT_NETWORK } from './config';

const STORM_API_URL = CURRENT_NETWORK.stormApi;

/**
 * Fetches the current mark price for a perp market as an Observable
 */
export const getMarkPrice$ = (symbol: string): Observable<number> => {
  return from(axios.get(`${STORM_API_URL}/pairs/${symbol}`)).pipe(
    map(res => res.data?.lastPrice || 0),
    catchError(err => {
      console.error(`[Storm Trade] Failed to fetch price for ${symbol}: ${err.message}`);
      throw err;
    })
  );
};

/**
 * Fetches the current funding rate for a perp market
 */
export const getFundingRate$ = (symbol: string): Observable<number> => {
    return from(axios.get(`${STORM_API_URL}/pairs/${symbol}/funding`)).pipe(
      map(res => res.data?.fundingRate || 0), // Assuming output is raw rate
      catchError(err => {
        console.error(`[Storm Trade] Failed to fetch funding rate for ${symbol}: ${err.message}`);
        // Return 0 so we don't crash strategy, but log error
        return of(0);
      })
    );
  };

/**
 * Builds the transaction payload to open a short position
 */
export const buildOpenPositionPayload = async (params: { vaultAddress: string, amount: string, leverage: number }) => {
  const { beginCell, toNano } = await import('@ton/core');
  
  // OpCode: Open Position (0x5fcc3d14 - hypothetical)
  const body = beginCell()
      .storeUint(0x5fcc3d14, 32)
      .storeUint(0, 64) // QueryID
      .storeCoins(toNano(params.amount)) // Margin Amount
      .storeUint(params.leverage * 100, 16) // Leverage (x100)
      .storeUint(0, 1) // Direction: 0 = Short, 1 = Long (Hypothetical)
      .endCell();

  return {
      to: params.vaultAddress,
      value: "100000000", // 0.1 TON gas
      body: body.toBoc().toString('base64')
  };
};

/**
 * Builds the transaction payload to close a short position
 */
export const buildClosePositionPayload = async (params: { vaultAddress: string, positionId: string }) => {
    const { beginCell } = await import('@ton/core');
    
    // OpCode: Close Position
    const body = beginCell()
        .storeUint(0x4c2f6d22, 32)
        .storeUint(0, 64)
        // We might not need positionId if Vault only has one? 
        // But usually pass it.
        .storeUint(Number(params.positionId) || 0, 32) 
        .endCell();

    return {
        to: params.vaultAddress,
        value: "100000000",
        body: body.toBoc().toString('base64')
    };
};

/**
 * Builds the transaction payload to add/remove margin (Rebalancing)
 */
export const buildAdjustMarginPayload = async (params: { vaultAddress: string, amount: string, isDeposit: boolean }) => {
    const { beginCell, toNano } = await import('@ton/core');
    
    // OpCode: Adjust Margin (Hypothetical 0x1a2b3c4d)
    const body = beginCell()
        .storeUint(0x1a2b3c4d, 32)
        .storeUint(0, 64)
        .storeCoins(toNano(params.amount))
        .storeBit(params.isDeposit ? 1 : 0) // 1 = Deposit, 0 = Withdraw
        .endCell();

    return {
        to: params.vaultAddress,
        value: "50000000", // 0.05 TON
        body: body.toBoc().toString('base64')
    };
};
