import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'ERROR', 'WARN', 'PANIC' or null for all
    const wallet = searchParams.get('wallet'); // Filter by user wallet
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    
    // Filter by Type/Level
    if (type) {
      if (type === 'PANIC') {
        where.action = { contains: 'PANIC' };
      } else {
        where.level = type;
      }
    }

    // Filter by Component
    const component = searchParams.get('comp');
    if (component) {
        where.component = component;
    }

    // Filter by Wallet or PairId (Join via Position)
    const pairId = searchParams.get('pairId');

    if (wallet || pairId) {
      where.position = {};
      
      if (wallet) {
        where.position.user = {
            walletAddress: { contains: wallet, mode: 'insensitive' }
        };
      }
      
      if (pairId) {
        where.position.pairId = pairId;
      }
    }

    // Filter by Date Range
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (from || to) {
        where.timestamp = {};
        if (from) where.timestamp.gte = new Date(from);
        if (to) where.timestamp.lte = new Date(to);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        position: {
          select: {
            pairId: true,
            user: {
              select: { walletAddress: true, username: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ logs });

  } catch (error) {
    console.error('[Admin API] Activity Error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
