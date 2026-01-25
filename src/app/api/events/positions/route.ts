import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent caching of the stream
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      let lastHash = '';

      // 2. Polling Loop (Server-Side)
      // This is more efficient than client polling because it stays internal to region
      // and shares the Prisma connection pool.
      while (!closed) {
        try {
          // Dynamic import to ensure fresh data in loop if needed
          const { prisma } = await import('@/lib/prisma');
          
          if (closed) break;

          const positions = await prisma.position.findMany({
            where: {
              OR: [
                { userId: userId },
                { user: { walletAddress: userId } }
              ]
            },
            include: { user: true },
            orderBy: { updatedAt: 'desc' }
          });

          if (closed) break;

          // Simple hashing to detect change
          const currentHash = JSON.stringify(positions.map(p => ({ id: p.id, status: p.status, equity: p.totalEquity })));

          if (currentHash !== lastHash) {
             const payload = JSON.stringify({ positions });
             controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
             lastHash = currentHash;
          } else {
             // Send heartbeat to keep connection alive
             controller.enqueue(encoder.encode(': heartbeat\n\n')); 
          }

        } catch (error) {
          // If the controller is already closed, we should exit the loop
          if (error instanceof TypeError && error.message.includes('Controller is already closed')) {
             closed = true;
             break;
          }
          console.error('[SSE] Error fetching positions:', error);
          // Don't close immediately on transient db error, just wait and retry
        }

        // Wait 1 second before next check
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    },
    cancel() {
      closed = true;
      console.log(`[SSE] Client disconnected for user ${userId}`);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
