import { prisma } from '../lib/prisma';

async function checkRecentPositions() {
  console.log('=== Recent Positions ===');
  const positions = await prisma.position.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  });
  
  positions.forEach((pos) => {
    console.log(`\nID: ${pos.id}`);
    console.log(`Pair: ${pos.pairId}`);
    console.log(`Status: ${pos.status}`);
    console.log(`Vault: ${pos.vaultAddress}`);
    console.log(`Spot Amount: ${pos.spotAmount}`);
    console.log(`Perp Amount: ${pos.perpAmount}`);
    console.log(`Entry TX: ${pos.entryTxHash}`);
    console.log(`Created: ${pos.createdAt}`);
    console.log(`Updated: ${pos.updatedAt}`);
  });
  
  console.log('\n=== Recent Entry Logs ===');
  const entryLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: { contains: 'ENTRY' } },
        { action: { contains: 'Entry' } }
      ]
    },
    orderBy: { timestamp: 'desc' },
    take: 15
  });
  
  entryLogs.forEach((log) => {
    console.log(`\n[${log.timestamp.toISOString()}] [${log.level}] ${log.component} - ${log.action}`);
    if (log.positionId) console.log(`Position: ${log.positionId}`);
    if (log.details) console.log(`Details: ${log.details}`);
  });
}

checkRecentPositions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
