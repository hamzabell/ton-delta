/* eslint-disable */
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
  status: 'active' | 'stasis' | 'emergency' | 'closed' | 'stasis_pending_stake' | 'stasis_active' | 'pending_entry' | 'pending_entry_verification' | 'processing_exit' | 'exit_monitoring';
  createdAt: string;
  updatedAt: string;
  lastRebalanced?: string | Date; // Added for UI compatibility
  auditLogs?: any[];
  vaultAddress?: string;
  user?: { walletAddress: string };
  exitTxHash?: string;
  entryTxHash?: string;
  spotTxHash?: string;
  stormTxHash?: string;
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
  risk: 'High' | 'Medium' | 'Low' | 'Conservative';
  category: string;
  icon: string;
  isHot?: boolean;
}

export interface MarketData {
  spotPrice: number;
  perpPrice: number;
  basis: number;        // Β calculation
  fundingRate: number;
  volume24h: number;
  timestamp: number;
}
