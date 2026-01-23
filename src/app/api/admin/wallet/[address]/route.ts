import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
     const { address } = await params;

     if (!address) {
         return NextResponse.json({ error: 'Address required' }, { status: 400 });
     }

     // 1. Fetch User Profile
     const user = await prisma.user.findFirst({
         where: { walletAddress: { contains: address, mode: 'insensitive' } },
         include: {
             positions: {
                 orderBy: { createdAt: 'desc' }
             }
         }
     });

     if (!user) {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
     }

     // 2. Fetch Audit Logs (Timeline)
     // Link via User -> Positions -> AuditLogs
     const logs = await prisma.auditLog.findMany({
         where: {
             position: {
                 userId: user.id
             }
         },
         orderBy: { timestamp: 'desc' },
         take: 100,
         include: {
             position: {
                 select: { pairId: true }
             }
         }
     });

     // 3. Fetch Transactions (PnL)
     // Link via Strategy (approx) or we need to add userId to Transaction (schema limitation?)
     // Current schema: Transaction -> Strategy. Position -> User.
     // We can try to infer transactions via timestamp overlap or if they are linked to user's strategies?
     // Actually, Transaction doesn't have userId. We'll skip specific transactions for now or fetch global if needed.
     // WAIT: Schema check -> Transaction is linked to Strategy, not User directly.
     // Ideally we should have linked Transaction to Position or User.
     // For now, we will just return the Wallet's Positions and Logs.

     return new NextResponse(JSON.stringify({
         user,
         positions: user.positions,
         logs
     }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), {
        headers: { 'Content-Type': 'application/json' }
     });

  } catch (error) {
    console.error('[Admin API] Wallet Detail Error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet details' }, { status: 500 });
  }
}
