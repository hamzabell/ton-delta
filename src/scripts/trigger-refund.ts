import { prisma } from '../lib/prisma';
import { ExecutionService } from '../lib/execution';

async function triggerRefund() {
  console.log('=== Manual Refund Trigger ===\n');
  
  const position = await prisma.position.findFirst({
    where: { status: 'pending_entry', pairId: 'meta-ton' },
    include: { user: true }
  });
  
  if (!position) {
    console.log('❌ No pending entry position found');
    process.exit(0);
  }
  
  console.log('✅ Found position:');
  console.log(`   ID: ${position.id}`);
  console.log(`   Pair: ${position.pairId}`);
  console.log(`   Vault: ${position.vaultAddress}`);
  console.log(`   User wallet: ${position.user.walletAddress}`);
  console.log(`   Capital: ${position.capitalTON} TON`);
  console.log('\\n📤 Triggering refund...');
  
  try {
    await ExecutionService.forceVaultExit(
      position.id,
      position.vaultAddress,
      position.user.walletAddress || position.userId
    );
    console.log('\\n✅ Refund triggered successfully!');
    console.log('\\n💡 The vault will sweep all TON back to the user wallet.');
  } catch (err: any) {
    console.error('\\n❌ Refund failed:', err.message);
  }
  
  process.exit(0);
}

triggerRefund();
