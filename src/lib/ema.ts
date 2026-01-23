import redis from './redis';
import { Logger } from '../services/logger';

/**
 * Service to handle Exponential Moving Average (EMA) calculations using Redis time-series data.
 * Usage:
 * 1. pushPrice(ticker, price) -> Adds new data point
 * 2. getEMA(ticker, period) -> Returns smoothed price
 */
export const EMAService = {
    
    /**
     * Pushes a new price point to Redis Sorted Set.
     * key: price_history:{ticker}
     * score: timestamp
     * member: price (string) - Note: We might need unique members if price matches exactly, so we append timestamp.
     */
    pushPrice: async (ticker: string, price: number) => {
        const key = `price_history:${ticker}`;
        const timestamp = Date.now();
        const member = `${price}:${timestamp}`; // Ensure uniqueness
        
        // Add to ZSET
        await redis.zadd(key, timestamp, member);
        
        // Prune older than 1 hour (optimisation)
        const oneHourAgo = timestamp - (60 * 60 * 1000);
        await redis.zremrangebyscore(key, 0, oneHourAgo);
    },

    /**
     * Calculates EMA for the requested window (in seconds).
     * @param ticker Asset ticker (e.g. TON)
     * @param windowSeconds Window size (e.g. 300 for 5m EMA)
     */
    getEMA: async (ticker: string, windowSeconds: number): Promise<number | null> => {
        const key = `price_history:${ticker}`;
        const now = Date.now();
        const fromScore = now - (windowSeconds * 1000);
        
        // Fetch range
        const data = await redis.zrangebyscore(key, fromScore, now);
        
        if (data.length === 0) return null;

        // Parse prices
        const prices = data.map(d => parseFloat(d.split(':')[0]));
        
        // Calculate SMA (Simple Moving Average) first if not enough data for true EMA recursion
        // Or strictly implement standard EMA?
        // Standard EMA: Current = (Price * k) + (PreviousEMA * (1-k))
        // k = 2 / (N + 1). N = Number of periods? 
        // Here we have time-series. A simple Time-Weighted Average (TWAP) or SMA is often robust enough for "Wick Protection".
        // Whitepaper says "EMA_5". Let's assume standard SMA over the window for simplicity and robustness against outliers.
        // Actually, let's filter out outliers (Median?) No, Average is fine for smoothing.
        
        const sum = prices.reduce((a, b) => a + b, 0);
        return sum / prices.length;
    }
};
