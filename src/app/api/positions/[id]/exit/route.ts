import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionService } from '@/lib/execution';
import { Logger } from '@/services/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: positionId } = await params;

  try {
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: { user: true }
    });

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    // Call the Universal Exit Logic
    // This handles Active, Cash Stasis, and Yield Stasis atomically.
    const txHash = await ExecutionService.executePanicUnwind(positionId, "USER_REQUESTED_EXIT");

    await Logger.info('API', 'POSITION_EXIT_INITIATED', positionId, { txHash });

    return NextResponse.json({ 
      success: true, 
      txHash,
      message: "Exit Sequence Initiated. Watch your wallet for the sweep." 
    });

  } catch (error) {
    console.error("Exit API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
