import { timer, from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Fetches the current mark price for a perp market as an Observable
 */
export const getMarkPrice$ = (symbol: string): Observable<number> => {
  console.log(`[Storm Trade] Fetching mark price for ${symbol}`);
  
  // Mocking for now
  const mockPrices: Record<string, number> = {
    'TON': 5.48,
    'BTC': 42000
  };
  
  return of(mockPrices[symbol] || 5.48);
};

/**
 * Opens a short position via a Smart Contract Vault as an Observable
 */
export const openShort$ = (params: { vaultAddress: string, amount: number, leverage: number }): Observable<void> => {
  console.log(`[Storm Trade] Opening ${params.leverage}x Short for ${params.amount} USDT via Vault ${params.vaultAddress}`);
  return of(undefined);
};
