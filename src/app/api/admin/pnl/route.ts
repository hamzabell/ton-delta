import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfMonth, startOfYear, subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 1y, all

    // 1. Calculate Date Range
    let startDate = new Date();
    if (range === '7d') startDate = subDays(new Date(), 7);
    if (range === '30d') startDate = subDays(new Date(), 30);
    if (range === '1y') startDate = startOfYear(new Date());

    // 2. Fetch Transactions with PnL
    const transactions = await prisma.transaction.findMany({
      where: {
        timestamp: { gte: startDate },
        status: 'SUCCESS',
        realizedPnl: { not: null }
      },
      orderBy: { timestamp: 'asc' }
    });

    // 3. Aggregate Data (Daily)
    const dailyMap = new Map<string, { date: string, profit: number, fees: number, trades: number }>();
    
    transactions.forEach(tx => {
      const dayKey = format(tx.timestamp, 'yyyy-MM-dd');
      const current = dailyMap.get(dayKey) || { date: dayKey, profit: 0, fees: 0, trades: 0 };
      
      current.profit += (tx.realizedPnl || 0);
      current.fees += (tx.feesPaid || 0);
      current.trades += 1;
      
      dailyMap.set(dayKey, current);
    });

    // 4. Calculate Totals
    const totalRealizedPnl = transactions.reduce((sum, tx) => sum + (tx.realizedPnl || 0), 0);
    const totalFees = transactions.reduce((sum, tx) => sum + (tx.feesPaid || 0), 0);
    const netProfit = totalRealizedPnl - totalFees;

    return NextResponse.json({
      summary: {
        totalRealizedPnl,
        totalFees,
        netProfit,
        tradeCount: transactions.length
      },
      chartData: Array.from(dailyMap.values())
    });

  } catch (error) {
    console.error('[Admin API] PnL Error:', error);
    return NextResponse.json({ error: 'Failed to fetch PnL analytics' }, { status: 500 });
  }
}
