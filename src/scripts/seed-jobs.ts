
import { prisma } from '../lib/prisma';
import { scheduleRecurringJob } from '../lib/pg-queue';

async function seedJobs() {
  console.log('🌱 Seeding recurring jobs...');

  const jobs = [
    {
      name: 'entry-job',
      payload: {},
      cron: '*/10 * * * * *' // Every 10 seconds
    },
    {
      name: 'strategy-job',
      payload: {},
      cron: '0 * * * * *' // Every minute
    },
    {
      name: 'drift-monitor',
      payload: {},
      cron: '*/30 * * * * *' // Every 30 seconds
    },
    {
      name: 'safety-check',
      payload: {},
      cron: '*/20 * * * * *' // Every 20 seconds
    },
    {
      name: 'valuation-job',
      payload: {},
      cron: '*/15 * * * * *' // Every 15 seconds
    },
    {
      name: 'keeper-monitor',
      payload: {},
      cron: '*/30 * * * * *' // Every 30 seconds
    }
  ];

  for (const job of jobs) {
    try {
      const jobId = await scheduleRecurringJob(job.name, job.payload, job.cron);
      console.log(`✅ Scheduled ${job.name} (ID: ${jobId})`);
    } catch (e) {
      console.error(`❌ Failed to schedule ${job.name}:`, e);
    }
  }

  console.log('\n✨ Job seeding complete!');
}

seedJobs()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
