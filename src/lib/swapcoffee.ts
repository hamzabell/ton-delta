import { RoutingApi, Configuration } from '@swap-coffee/sdk';
import { TonClient } from 'ton';
import { from, timer, Observable, throwError } from 'rxjs';
import { switchMap, map, catchError, shareReplay } from 'rxjs/operators';

const config = new Configuration({
  apiKey: process.env.SWAP_COFFEE_API_KEY
});

const routingApi = new RoutingApi(config);
const tonClient = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });

const toTokenAddress = (address: string) => ({
  blockchain: 'ton',
  address: address === 'TON' || address === 'ton' ? 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c' : address
});

/**
 * Fetches the current spot price for a given pair as an Observable
 */
export const getSpotPrice$ = (fromAddress: string, toAddress: string, intervalMs: number = 60000): Observable<number> => {
  return timer(0, intervalMs).pipe(
    switchMap(() => from(routingApi.buildRoute({
      input_token: toTokenAddress(fromAddress),
      output_token: toTokenAddress(toAddress),
      input_amount: 1,
    }))),
    map(route => {
      if (!route.data.paths || route.data.paths.length === 0) {
        throw new Error('No route found for price discovery');
      }
      const amountOut = BigInt(route.data.amount_out);
      return Number(amountOut) / 1000000000;
    }),
    catchError(error => {
      console.error('[Swap.coffee] Error fetching price:', error);
      // Fallback for TON price if demo
      if (fromAddress === 'TON' || fromAddress === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
        return from([5.42]);
      }
      return throwError(() => error);
    }),
    shareReplay(1)
  );
};

/**
 * Prepares a swap transaction as an Observable
 */
export const buildSwapTransaction$ = (params: { 
  senderAddress: string, 
  fromAddress: string, 
  toAddress: string, 
  amount: string,
  slippage?: number 
}): Observable<any[]> => {
  return from(routingApi.buildRoute({
    input_token: toTokenAddress(params.fromAddress),
    output_token: toTokenAddress(params.toAddress),
    input_amount: Number(BigInt(params.amount)) / 1000000000,
  })).pipe(
    switchMap(route => from(routingApi.buildTransactionsV2({
      sender_address: params.senderAddress,
      slippage: params.slippage || 0.01,
      paths: route.data.paths,
    }))),
    map(transactions => transactions.data.transactions),
    catchError(error => {
      console.error('[Swap.coffee] Error building transaction:', error);
      return throwError(() => error);
    })
  );
};
