import 'dotenv/config';
import { Worker } from 'bullmq';
import { redisConfig } from './config';
import { driftMonitorJob } from './jobs/drift-monitor';
import { safetyCheckJob } from './jobs/safety-check';
import { strategyJob } from './jobs/strategy';
import { valuationJob } from './jobs/valuation';
import { processEntryJob } from './jobs/entry';

import { Logger } from '../services/logger';

console.log('[Worker] Starting Watchman Engine...');

// Log System Event
// Log System Event
Logger.info('System', 'WATCHMAN_ENGINE_STARTED', undefined, { timestamp: new Date().toISOString() });

const watchmanWorker = new Worker('watchman', async (job) => {
  switch (job.name) {
    case 'drift-monitor':
      return await driftMonitorJob(job);
    case 'safety-check':
      return await safetyCheckJob(job);
    case 'strategy-job':
      return await strategyJob(job);
    case 'valuation-job':
      return await valuationJob(job);
    case 'entry-job':
      return await processEntryJob(job);
    default:
      console.warn(`[Worker] Unknown job: ${job.name}`);
  }
}, {
  connection: redisConfig,
  concurrency: 1
});

watchmanWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) completed`);
});

watchmanWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
});

console.log('[Worker] Listening for jobs...');
