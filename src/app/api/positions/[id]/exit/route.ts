import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionService } from '@/lib/execution';
import { Logger } from '@/services/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let positionId: string | undefined;
  
  try {
    const { id } = await params;
    positionId = id;

    Logger.info('API', 'EXIT_REQUEST_RECEIVED', positionId);

    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: { user: true }
    });

    if (!position) {
      Logger.warn('API', 'POSITION_NOT_FOUND', positionId);
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    Logger.info('API', 'POSITION_FOUND', positionId, { 
      status: position.status, 
      pairId: position.pairId 
    });

    // Call the Universal Exit Logic
    // This handles Active, Cash Stasis, and Yield Stasis atomically.
    const txHash = await ExecutionService.executePanicUnwind(positionId, "USER_REQUESTED_EXIT");

    await Logger.info('API', 'POSITION_EXIT_INITIATED', positionId, { txHash });

    // Get the vault address to construct explorer link
    const vaultAddress = position.vaultAddress || position.user.walletAddress;
    const explorerLink = `https://tonviewer.com/${vaultAddress}`;

    return NextResponse.json({ 
      success: true, 
      txHash,
      explorerLink,
      message: "Exit Sequence Initiated. Watch your wallet for the sweep." 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    Logger.error('API', 'EXIT_REQUEST_FAILED', positionId || 'unknown', { 
      error: errorMessage,
      stack: errorStack 
    });
    
    console.error("Exit API Error:", error);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
