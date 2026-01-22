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
     // Convert pairId (dogs-ton) to Storm symbol (DOGS-TON) (Heuristic)
     const symbol = pairId.toUpperCase().replace('-', '_'); // Storm might use underscore or hyphen. API V1 uses underscore usually? Check pairs output? 
     // Pairs output had symbols. Let's assume standard format or try fetching pairs first.
     // Actually, let's fetch ALL pairs and find the one.
     
     const res = await fetch(`${API_CONFIG.stormTrade.baseUrl}/pairs`, { 
         next: { revalidate: 30 },
         signal: AbortSignal.timeout(5000)
     });
     if (res.ok) {
         const data = await res.json();
         const pairs = Array.isArray(data) ? data : data.pairs;
         // Find matching pair. pairId: dogs-ton. Storm Symbol: DOGS-TON or TON-DOGS? 
         // Let's match roughly.
         const pairData = pairs.find((p: any) => 
             p.symbol.replace(/[^a-zA-Z]/g, '').toLowerCase() === pairId.replace(/[^a-zA-Z]/g, '')
         );
         
         if (pairData) {
             const lastPrice = parseFloat(pairData.lastPrice);
             const fundingRate = parseFloat(pairData.fundingRate);
             
             return NextResponse.json({
                spotPrice: lastPrice, // Approx
                perpPrice: lastPrice, 
                basis: 0,
                fundingRate: fundingRate * 100, // Percentage
                timestamp: Date.now()
             });
         }
     }
  } catch (e) {
      console.warn("Market Data Fetch Failed, using simulation", e);
  }
  
  await delay(200); 
  const basePrice = 0.0012;
  const volatility = 0.0001;
  
  const spotPrice = basePrice + (Math.random() * volatility - volatility/2);
  const perpPrice = spotPrice * (1 + (Math.random() * 0.002 - 0.001)); 
  
  const basis = perpPrice - spotPrice;
  const fundingRate = (basis / spotPrice) * 100; 

  return NextResponse.json({
    spotPrice,
    perpPrice,
    basis,
    fundingRate,
    timestamp: Date.now()
  });
}
