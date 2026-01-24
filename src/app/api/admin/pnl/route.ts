import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all active and closed positions
    const positions = await prisma.position.findMany({
      include: { user: true }
    });
    
    // Calculate metrics
    const totalProfit = positions.reduce((sum, pos) => {
      const initialEstimate = pos.principalFloor / 0.85;
      const profit = pos.totalEquity - initialEstimate;
      return sum + (profit > 0 ? profit : 0);
    }, 0);
    
    // Performance fees (20% of profits)
    const performanceFees = totalProfit * 0.20;
    const userProfits = totalProfit * 0.80;
    
    // User-wise PnL summary
    const userPnL = positions.reduce((acc, pos) => {
      const userId = pos.userId;
      const initialEstimate = pos.principalFloor / 0.85;
      const profit = pos.totalEquity - initialEstimate;
      
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          walletAddress: pos.user.walletAddress,
          totalInvested: 0,
          currentValue: 0,
          profit: 0
        };
      }
      
      acc[userId].totalInvested += initialEstimate;
      acc[userId].currentValue += pos.totalEquity;
      acc[userId].profit += profit;
      
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json({
      summary: {
        totalGrossProfit: totalProfit,
        performanceFees,
        userProfits
      },
      userBreakdown: Object.values(userPnL)
    });
    
  } catch (error) {
    console.error('PnL API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PnL data' },
      { status: 500 }
    );
  }
}
