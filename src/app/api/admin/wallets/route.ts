import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all positions with vault addresses
    const positions = await prisma.position.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const wallets = positions.map(pos => ({
      positionId: pos.id,
      userId: pos.userId,
      userWalletAddress: pos.user.walletAddress || pos.userId,
      vaultAddress: pos.vaultAddress,
      status: pos.status,
      totalEquity: pos.totalEquity,
      createdAt: pos.createdAt
    }));
    
    return NextResponse.json({ wallets });
    
  } catch (error) {
    console.error('Wallets API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}
