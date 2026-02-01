import { prisma } from '../lib/prisma';
import { ExecutionService } from '../lib/execution';
import { Logger } from '../services/logger';

async function triggerEntry() {
  const positionId = process.argv[2] || '08e3a97b-97da-47ef-a624-3806201960ba';
  
  console.log(`\n=== Triggering Entry for Position ${positionId} ===\n`);
  
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { user: true }
  });
  
  if (!position) {
    console.error(`❌ Position ${positionId} not found`);
    process.exit(1);
  }
  
  console.log(`Pair: ${position.pairId}`);
  console.log(`Status: ${position.status}`);
  console.log(`Vault: ${position.vaultAddress}`);
  console.log();
  
  try {
    console.log('🚀 Calling ExecutionService.enterInitialPosition()...\n');
    await ExecutionService.enterInitialPosition(positionId);
    
    console.log('\n✅ Entry execution completed successfully!');
    console.log('\nCheck logs and database to confirm:');
    console.log('- Position status should be "pending_entry_verification"');
    console.log('- entryTxHash should be populated');
    console.log('- spotAmount and perpAmount should be set');
    
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Entry Failed: ${errorMsg}`);
    console.error('\nFull error:', err);
    process.exit(1);
  }
}

triggerEntry()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
