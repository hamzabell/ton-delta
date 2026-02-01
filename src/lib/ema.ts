import { prisma } from './prisma';
import { Logger } from '../services/logger';

/**
 * Service to handle Exponential Moving Average (EMA) calculations using PostgreSQL.
 * Replaces Redis sorted sets with database table.
 * Usage:
 * 1. pushPrice(ticker, price) -> Adds new data point
 * 2. getEMA(ticker, period) -> Returns smoothed price
 */
export const EMAService = {
    
    /**
     * Pushes a new price point to PostgreSQL.
     */
    pushPrice: async (ticker: string, price: number) => {
        // Add to database
        await prisma.priceHistory.create({
            data: {
                ticker,
                price,
                timestamp: new Date(),
            },
        });
        
        // Prune older than 1 hour (optimization)
        const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
        await prisma.priceHistory.deleteMany({
            where: {
                ticker,
                timestamp: { lt: oneHourAgo },
            },
        });
    },

    /**
     * Calculates EMA for the requested window (in seconds).
     * @param ticker Asset ticker (e.g. TON)
     * @param windowSeconds Window size (e.g. 300 for 5m EMA)
     */
    getEMA: async (ticker: string, windowSeconds: number): Promise<number | null> => {
        const now = new Date();
        const fromDate = new Date(now.getTime() - (windowSeconds * 1000));
        
        // Fetch price history within window
        const priceHistory = await prisma.priceHistory.findMany({
            where: {
                ticker,
                timestamp: { gte: fromDate },
            },
            orderBy: { timestamp: 'asc' },
        });
        
        if (priceHistory.length === 0) return null;

        // Calculate Simple Moving Average (SMA) over the window
        // This provides smooth averaging for "Wick Protection" as mentioned in whitepaper
        const sum = priceHistory.reduce((acc, record) => acc + record.price, 0);
        return sum / priceHistory.length;
    }
};
