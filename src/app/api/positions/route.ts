import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // If no DATABASE_URL is configured, return empty positions (prototype mode)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ positions: [] });
    }

    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId'); 
    const pairId = searchParams.get('pairId');

    const whereClause: any = { status: 'active' };
    if (pairId) {
      whereClause.pairId = pairId;
    }

    // Fetch active positions
    const positions = await prisma.position.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { 
        user: true,

      } 
    });

    return NextResponse.json({ positions });
  } catch (error) {
    // Silently return empty positions if DB is unavailable
    return NextResponse.json({ positions: [] }); 
  }
}

export async function POST(request: Request) {
  try {
    // If no DATABASE_URL is configured, return mock success (prototype mode)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        success: true, 
        positionId: 'mock-position-' + Date.now(),
        message: 'Position created (mock - no database configured)'
      });
    }

    const body = await request.json();
    const { pairId, capitalTON, userId = 'demo-user', maxLossPercentage } = body;

    if (!pairId || !capitalTON) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Atomic Position Creation (Simulation)
    
    // Find User by ID or Wallet Address
    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { id: userId },
                { walletAddress: userId }
            ]
        }
    });

    // Create User if doesn't exist (Auto-provisioning for connected wallet)
    if (!user) {
         console.log(`Auto-provisioning user for wallet: ${userId}`);
         try {
             user = await prisma.user.create({
                 data: {
                     id: userId, // Use wallet addr as ID
                     walletAddress: userId,
                     // Properties removed in refactor

                     username: 'WalletUser'
                 }
             });
         } catch (createError) {
             console.error('Failed to auto-create user', createError);
             // Verify if it failed due to race condition and user now exists
             user = await prisma.user.findFirst({ where: { walletAddress: userId } });
             if (!user) throw createError;
         }
    }
    
    const position = await prisma.position.create({
      data: {
        userId: user?.id || 'manual-uuid-placeholder', 
        pairId,
        spotAmount: capitalTON / 2, 
        perpAmount: capitalTON / 2, // simplified
        spotValue: capitalTON / 2,
        perpValue: capitalTON / 2,
        totalEquity: capitalTON,
        principalFloor: capitalTON * 0.85,
        entryPrice: 1.0, 
        currentPrice: 1.0,
        fundingRate: 0.01,
        driftCoefficient: 0,
        status: 'active',
        maxLossPercentage: maxLossPercentage || 0.20,
        delegationDuration: body.delegationDuration || '7d',
        delegationExpiry: calculateExpiry(body.delegationDuration || '7d'),
        stasisPreference: body.stasisPreference || 'CASH',
        vaultAddress: body.vaultAddress || user?.walletAddress // Fallback to user wallet if no specific vault addr (e.g. non-custodial)
      }
    });

    // Log Creation Event
    await Logger.info('API', 'POSITION_CREATED', position.id, {
        vaultAddress: body.vaultAddress,
        capital: capitalTON,
        delegationDuration: body.delegationDuration
    });

    return NextResponse.json({ 
      success: true, 
      positionId: position.id 
    });

  } catch (error) {
    console.error(error);
    await Logger.error('API', 'POSITION_CREATION_FAILED', undefined, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

function calculateExpiry(duration: string): Date {
    const now = Date.now();
    const map: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000
    };
    return new Date(now + (map[duration] || map['7d']));
}
