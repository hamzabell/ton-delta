import { NextResponse } from 'next/server';
import { TonClient } from '@ton/ton';
import { API_CONFIG } from '@/lib/constants';

// Initialize TON Client
const client = new TonClient({
  endpoint: API_CONFIG.ton.rpcUrl,
  apiKey: process.env.TON_API_KEY, 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const balance = await client.getBalance(address as any);
    // balance is in nanoton
    const balanceTon = Number(balance) / 1e9;
    
    return NextResponse.json({ balance: balanceTon });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({ balance: 0, error: 'Failed to fetch' });
  }
}
