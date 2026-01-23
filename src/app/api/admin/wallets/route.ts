import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        positions: {
          select: {
            id: true,
            totalEquity: true,
            status: true
          }
        },
        _count: {
          select: { positions: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    const stats = users.map(user => {
      const activePositions = user.positions.filter(p => p.status === 'active');
      const totalEquity = user.positions.reduce((sum, p) => sum + (p.totalEquity || 0), 0);
      
      return {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        telegramId: user.telegramId.toString(),
        totalPositions: user._count.positions,
        activeCount: activePositions.length,
        totalEquity,
        lastActive: 'Now' // Placeholder, could use updatedAt from positions
      };
    });

    return NextResponse.json({ wallets: stats });

  } catch (error) {
    console.error('[Admin API] Wallets List Error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}
