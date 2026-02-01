import { prisma } from '../lib/prisma';
import { enqueueJob } from '../lib/pg-queue';

async function triggerRecurringJobs() {
  console.log('Triggering recurring jobs manually...\n');
  
  const recurringJobs = await prisma.job.findMany({
    where: {
      recurring: true,
      status: 'completed',
    },
  });

  console.log(`Found ${recurringJobs.length} completed recurring jobs`);

  for (const job of recurringJobs) {
    console.log(`Creating instance for: ${job.name}`);
    
    await enqueueJob(
      job.name,
      job.payload as Record<string, unknown>,
      { priority: job.priority }
    );
  }

  console.log('\n✅ All recurring jobs triggered!');
  console.log('New job instances have been enqueued and will process shortly.');
  
  await prisma.$disconnect();
}

triggerRecurringJobs().catch(console.error);
