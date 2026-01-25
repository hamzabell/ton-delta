
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/services/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Correct params type for Next.js 15+
) {
  let positionId: string | undefined;

  try {
     const { id } = await params;
     positionId = id;

    Logger.info('API', 'CONFIRM_EXIT_RECEIVED', positionId);

    // Update status to 'processing_exit'
    // This is called by the frontend ONLY after a successful wallet signature.
    await prisma.position.update({
        where: { id: positionId },
        data: { status: 'processing_exit' }
    });
    
    Logger.info('API', 'CONFIRM_EXIT_SUCCESS', positionId);

    return NextResponse.json({ success: true });

  } catch (error) {
    Logger.error('API', 'CONFIRM_EXIT_FAILED', positionId || 'unknown', { error: String(error) });
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
