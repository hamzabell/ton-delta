import { Worker } from 'bullmq';
import { redisConfig } from './config';
import { driftMonitorJob } from './jobs/drift-monitor';
import { safetyCheckJob } from './jobs/safety-check';
import { strategyJob } from './jobs/strategy';

console.log('[Worker] Starting Watchman Engine...');

const watchmanWorker = new Worker('watchman', async (job) => {
  switch (job.name) {
    case 'drift-monitor':
      return await driftMonitorJob(job);
    case 'safety-check':
      return await safetyCheckJob(job);
    case 'strategy-job':
      return await strategyJob(job);
    default:
      console.warn(`[Worker] Unknown job: ${job.name}`);
  }
}, {
  connection: redisConfig,
  concurrency: 5
});

watchmanWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) completed`);
});

watchmanWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
});

console.log('[Worker] Listening for jobs...');
