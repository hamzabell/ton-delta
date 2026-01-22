export interface Position {
  id: string;
  pairId: string;
  spotValue: number;     // S_spot
  perpValue: number;     // S_perp
  totalEquity: number;   // E_total
  entryPrice: number;
  currentPrice: number;
  fundingRate: number;
  fundingRateEMA: number; // 24h EMA
  driftCoefficient: number; // δ_drift
  principalFloor: number;   // E_floor
  status: 'active' | 'stasis' | 'emergency';
  createdAt: string;
  updatedAt: string;
}

export interface TradingPair {
  id: string;
  name: string;
  spotToken: string;
  baseToken: string;
  apr: number;
  fundingRate: number;
  volume24h: number;
  liquidity: number;
  risk: 'High' | 'Medium' | 'Low';
  category: string;
  icon: string;
}

export interface MarketData {
  spotPrice: number;
  perpPrice: number;
  basis: number;        // Β calculation
  fundingRate: number;
  volume24h: number;
  timestamp: number;
}
