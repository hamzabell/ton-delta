import { prisma } from '../lib/prisma';

async function checkStatus() {
  console.log('=== Checking Job Queue Status ===\n');
  
  // Check jobs
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log(`Total jobs: ${jobs.length}`);
  jobs.forEach(job => {
    console.log(`- ${job.name}: ${job.status} (recurring: ${job.recurring}, attempts: ${job.attempts})`);
  });
  
  console.log('\n=== Checking Position Status ===\n');
  
  // Check positions
  const positions = await prisma.position.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      pairId: true,
      status: true,
      spotAmount: true,
      perpAmount: true,
      createdAt: true,
    },
  });
  
  console.log(`Recent positions: ${positions.length}`);
  positions.forEach(pos => {
    console.log(`- ${pos.pairId}: ${pos.status} (spot: ${pos.spotAmount}, perp: ${pos.perpAmount}) - ${pos.createdAt.toISOString()}`);
  });
  
  // Check pending entry positions
  const pendingEntry = await prisma.position.findMany({
    where: {
      OR: [
        { status: 'pending_entry' },
        { status: 'active', spotAmount: 0, perpAmount: 0 }
      ]
    },
  });
  
  console.log(`\n=== Pending Entry Positions: ${pendingEntry.length} ===`);
  pendingEntry.forEach(pos => {
    console.log(`- Position ${pos.id} (${pos.pairId}): ${pos.status}`);
  });
  
  await prisma.$disconnect();
}

checkStatus().catch(console.error);
