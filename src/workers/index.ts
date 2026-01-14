import { Worker } from 'bullmq';
import { redisConfig } from './config';
import { fundingQueue, riskQueue, QUEUE_NAMES } from './queues';
import { processFundingJob } from './jobs/funding';
import { processRiskJob } from './jobs/risk';
import { processDepositJob } from './jobs/deposits';

console.log('🚀 Starting Neutron Backend Workers...');

// 1. Funding Harvester Worker
const fundingWorker = new Worker(QUEUE_NAMES.FUNDING, processFundingJob, {
  connection: redisConfig,
});
fundingWorker.on('completed', (job) => console.log(`[Funding] Job ${job.id} completed.`));
fundingWorker.on('failed', (job, err) => console.error(`[Funding] Job ${job?.id} failed: ${err.message}`));

// 2. Risk Manager Worker
const riskWorker = new Worker(QUEUE_NAMES.RISK, processRiskJob, {
  connection: redisConfig,
});
riskWorker.on('failed', (job, err) => console.error(`[Risk] Job ${job?.id} failed: ${err.message}`));

// 3. Deposit Processor Worker
const depositWorker = new Worker(QUEUE_NAMES.DEPOSIT, processDepositJob, {
  connection: redisConfig,
});
depositWorker.on('completed', (job) => console.log(`[Deposit] Job ${job.id} completed.`));
depositWorker.on('failed', (job, err) => console.error(`[Deposit] Job ${job?.id} failed: ${err.message}`));


// --- SCHEDULER (Initialize Repeatable Jobs) ---
async function initSchedulers() {
  console.log('⏳ Initializing Recurring Jobs...');
  
  // Funding Harvester: Every 8 hours
  await fundingQueue.add('harvest-funding', {}, {
    repeat: {
      pattern: '0 */8 * * *', // At minute 0 past every 8th hour
    },
  });
  console.log('✅ Scheduled Funding Harvester (Every 8 hours)');

  // Risk Manager: Every 1 minute
  await riskQueue.add('check-risk', {}, {
    repeat: {
        pattern: '* * * * *', // Every minute
    },
  });
  console.log('✅ Scheduled Risk Manager (Every 1 minute)');
}

initSchedulers().catch(console.error);

// Keep process alive
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down workers...');
    await fundingWorker.close();
    await riskWorker.close();
    await depositWorker.close();
    process.exit(0);
});
