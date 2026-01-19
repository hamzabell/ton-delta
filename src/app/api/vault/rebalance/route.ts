import { NextResponse } from 'next/server';
import { vault } from '@/lib/vault';

export async function POST(request: Request) {
  try {
    const { vaultAddress, strategyId } = await request.json();

    // Security check: Verify an internal secret token to prevent unauthorized triggers
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.N8N_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!vaultAddress || !strategyId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Trigger the on-chain rebalance via the keeper service
    await vault.triggerRebalance(vaultAddress, strategyId);

    return NextResponse.json({ 
      success: true, 
      message: `Rebalance triggered for ${vaultAddress}` 
    });
    
  } catch (error: any) {
    console.error('[API Rebalance] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
