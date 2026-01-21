import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { pairId: string } }) {
  // Simulated data generation (would be real API calls to Storm/swap.coffee)
  const basePrice = 0.0012;
  const volatility = 0.0001;
  
  const spotPrice = basePrice + (Math.random() * volatility - volatility/2);
  const perpPrice = spotPrice * (1 + (Math.random() * 0.002 - 0.001)); // Slight deviation
  
  const basis = perpPrice - spotPrice;
  const fundingRate = (basis / spotPrice) * 100; // Simplified funding calc

  return NextResponse.json({
    spotPrice,
    perpPrice,
    basis,
    fundingRate,
    timestamp: Date.now()
  });
}
