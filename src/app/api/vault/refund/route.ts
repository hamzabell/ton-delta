import { NextResponse } from 'next/server';
import { getKeeperWallet$, sendTransactions$ } from '@/lib/custodialWallet';
import { wrapWithKeeperRequest } from '@/lib/w5-utils';
import { Address, beginCell } from '@ton/core';
import { firstValueFrom } from 'rxjs';
import { getTonBalance } from '@/lib/onChain';
import { fromNano } from '@ton/core';

export async function POST(request: Request) {
  try {
    const { vaultAddress } = await request.json();

    if (!vaultAddress) {
      return NextResponse.json({ error: 'Vault address required' }, { status: 400 });
    }

    // Check current balance
    const balance = await getTonBalance(vaultAddress);
    const balanceTON = Number(fromNano(balance));

    if (balanceTON < 0.01) {
      return NextResponse.json({ error: 'Vault balance is zero or too low' }, { status: 400 });
    }

    // User wallet to receive funds - dynamic from headers if available
    const USER_WALLET = request.headers.get('x-user-wallet') || 'UQBF63kZHYMgnKWTlF2rxHIMlAFPN-gOMH7GXkONFgRAs44V';

    // 1. Build refund message
    const refundMsg = {
      to: Address.parse(USER_WALLET),
      value: BigInt(0),
      body: beginCell()
        .storeUint(0, 32)
        .storeStringTail("Pamelo Finance: Recovered Fund Sweep")
        .endCell(),
      mode: 128 // CARRY_ALL_REMAINING_BALANCE
    };

    // 2. Wrap with keeper request
    const targetAddress = Address.parse(vaultAddress);
    const wrappedCell = await wrapWithKeeperRequest(
      targetAddress,
      [refundMsg]
      // IMPORTANT: No keeperAddress here, we do NOT want to revoke the keeper again!
    );

    // 3. Broadcast
    const txs = [{
      address: vaultAddress,
      value: '50000000', // 0.05 TON for gas
      cell: wrappedCell.toBoc().toString('base64')
    }];

    console.log(`[Recovery] Attempting sweep for ${vaultAddress} to ${USER_WALLET}`);
    const result = await firstValueFrom(sendTransactions$(txs));

    return NextResponse.json({
      success: true,
      txHash: `seqno_${result.seqno}`,
      amountRefunded: (balanceTON - 0.05).toFixed(3)
    });

  } catch (error: any) {
    console.error('[Recovery] Sweep failed:', error);
    return NextResponse.json(
      { error: error.message || 'Sweep failed' },
      { status: 500 }
    );
  }
}
