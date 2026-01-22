import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // If no DATABASE_URL is configured, return empty positions (prototype mode)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ positions: [] });
    }

    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId'); 

    // Fetch active positions
    const positions = await prisma.position.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { user: true } 
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
    const { pairId, capitalTON, userId = 'demo-user' } = body;

    if (!pairId || !capitalTON) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Atomic Position Creation (Simulation)
    
    // Create dummy user if not exists (for prototype)
    let user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
        const demoUser = await prisma.user.findFirst();
        if (demoUser) {
            user = demoUser;
        } else {
             // In real app, would error here. For now, try to proceed or fail gracefully.
             // If no user found/create, we can't create position properly.
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
        status: 'active'
      }
    });

    return NextResponse.json({ 
      success: true, 
      positionId: position.id 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
