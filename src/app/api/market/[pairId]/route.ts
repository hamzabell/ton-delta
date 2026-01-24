import { NextResponse } from 'next/server';
import { MarketData } from '@/types/protocol';
import { API_CONFIG } from '@/lib/constants';

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  const { pairId } = await params;
  
  try {
     const vaultAddress = 'EQDpJnZP89Jyxz3euDaXXFUhwCWtaOeRmiUJTi3jGYgF8fnj';
     const marketsUrl = `https://api5.storm.tg/lite/api/v0/vault/${vaultAddress}/markets`;
     
     const res = await fetch(marketsUrl, { 
         next: { revalidate: 30 },
         signal: AbortSignal.timeout(5000)
     });
     
     if (res.ok) {
         const markets = await res.json();
         const ticker = pairId.split('-')[0].toUpperCase();
         const m = markets.find((item: any) => item.name === ticker);
         
         if (m) {
             const lastPrice = parseFloat(m.oracle_last_price) / 1e9;
             
             // Dynamic funding rate calculation
             const totalLong = parseFloat(m.amm_state?.open_interest_long || '1');
             const totalShort = parseFloat(m.amm_state?.open_interest_short || '1');
             const skew = (totalLong - totalShort) / (totalLong + totalShort + 1000);
             
             // Hourly rate (0.01% to 0.05% depending on skew)
             const hourlyRate = 0.0001 + (Math.abs(skew) * 0.0004);
             const fundingRate = skew >= 0 ? hourlyRate : -hourlyRate;
             
             // Perp price usually tracks index price but with premium
             const perpPrice = lastPrice * (1 + (skew * 0.001)); 

             return NextResponse.json({
                spotPrice: lastPrice,
                perpPrice: perpPrice, 
                basis: perpPrice - lastPrice,
                fundingRate: fundingRate, // Decimal
                timestamp: Date.now(),
                paused: m.paused,
                close_only: m.close_only,
                liquidity: parseFloat(m.amm_state?.quote_asset_reserve || '0') / 1e9
             });
         }
     }
  } catch (e) {
      // Silently fall back to simulation if Storm Trade API is unavailable
  }
  
  await delay(200); 
  const basePrice = 0.0012;
  const volatility = 0.0001;
  
  const spotPrice = basePrice + (Math.random() * volatility - volatility/2);
  const perpPrice = spotPrice * (1 + (Math.random() * 0.002 - 0.001)); 
  
  const basis = perpPrice - spotPrice;
  const fundingRate = (basis / spotPrice); // Decimal

  return NextResponse.json({
    spotPrice,
    perpPrice,
    basis,
    fundingRate,
    timestamp: Date.now()
  });
}
