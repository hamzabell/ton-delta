import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionService } from '@/lib/execution';
import { Logger } from '@/services/logger';
import { beginCell } from '@ton/core';

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

    // Call the Universal Exit Logic (Payload generation)
    // This allows the user to sign the transaction.
    const { payload, destination } = await ExecutionService.buildUserExitPayload(positionId, "USER_REQUESTED_EXIT");

    await Logger.info('API', 'POSITION_EXIT_PAYLOAD_GENERATED', positionId);

    // TRIGGER MONITORING
    // The user will sign the liquidation payload. 
    // We must monitor for the funds to arrive (from Storm/SwapCoffee) and then sweep them to the user.
    // Note: In serverless, this might be cut off, but we attempt to start it.
    ExecutionService.monitorAndSweep(
        position.id, 
        position.vaultAddress || position.user.walletAddress!, 
        position.user.walletAddress || position.userId
    ).catch(e => console.error("Failed to start monitor", e));

    // OPTIMISTIC UPDATE REMOVED:
    // We do NOT update to 'processing_exit' yet. 
    // The Frontend will show a loading state, and the STATUS will change 
    // only when the Keeper detects the 0.05 TON trigger on-chain.
    // This prevents the position from becoming "stuck" if the user cancels the signing.

    // Define keeperAddress for the response
    const keeperAddress = process.env.NEXT_PUBLIC_KEEPER_ADDRESS!;

    // To ensure the "refund [id]" memo is exactly as requested:
    const commentPayload = beginCell()
        .storeUint(0, 32)
        .storeStringTail(`refund ${positionId}`)
        .endCell()
        .toBoc()
        .toString('base64');

    // Forcing a structural change to bypass stale Turbopack cache
    return NextResponse.json({ 
      success: true, 
      triggerAddress: keeperAddress,
      triggerAmount: "0.05",
      transaction: {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
            {
                address: keeperAddress,
                amount: "50000000",
                payload: commentPayload 
            }
        ]
      },
      message: `Please sign the transaction to send 0.05 TON to the Keeper with the comment "refund ${positionId}". This will trigger your automated exit.`
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
