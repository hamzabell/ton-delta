import { NextResponse } from 'next/server';
import { TonClient, Address } from '@ton/ton';
import { CURRENT_NETWORK } from '@/lib/config';

// Initialize TON Client
const client = new TonClient({
  endpoint: CURRENT_NETWORK.tonApi,
  apiKey: process.env.TON_API_KEY, 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    console.log('Fetching balance for address:', address);
    const addressObj = Address.parse(address);
    const balance = await client.getBalance(addressObj);
    // balance is in nanoton
    const balanceTon = Number(balance) / 1e9;
    console.log('Balance fetched:', balanceTon);
    
    return NextResponse.json({ balance: balanceTon });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({ balance: 0, error: 'Failed to fetch' });
  }
}
