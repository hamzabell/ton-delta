import 'dotenv/config';
import { dequeueJob, completeJob, failJob, startListener, processRecurringJobs } from '../lib/pg-queue';
import { driftMonitorJob } from './jobs/drift-monitor';
import { safetyCheckJob } from './jobs/safety-check';
import { strategyJob } from './jobs/strategy';
import { valuationJob } from './jobs/valuation';
import { processEntryJob } from './jobs/entry';
import { keeperMonitorJob } from './jobs/keeper-monitor';

import { Logger } from '../services/logger';

console.log('[Worker] Starting Watchman Engine with PostgreSQL Queue...');

// Log System Event
Logger.info('System', 'WATCHMAN_ENGINE_STARTED', undefined, { timestamp: new Date().toISOString() });

let isProcessing = false;

/**
 * Process the next available job from the queue
 */
async function processNextJob() {
  if (isProcessing) return; // Prevent concurrent processing
  
  isProcessing = true;

  try {
    const job = await dequeueJob();
    
    if (!job) {
      isProcessing = false;
      return; // No jobs available
    }

    console.log(`[Worker] Processing job ${job.id} (${job.name})`);

    try {
      // Route job to appropriate handler
      let result;
      
      // Convert payload from Prisma.JsonValue to expected type
      const payload = job.payload as Record<string, unknown> || {};
      const jobData = { data: payload, id: job.id, name: job.name };

      switch (job.name) {
        case 'drift-monitor':
          result = await driftMonitorJob(jobData as any);
          break;
        case 'safety-check':
          result = await safetyCheckJob(jobData as any);
          break;
        case 'strategy-job':
          result = await strategyJob(jobData as any);
          break;
        case 'valuation-job':
          result = await valuationJob(jobData as any);
          break;
        case 'entry-job':
          result = await processEntryJob(jobData as any);
          break;
        case 'keeper-monitor':
          result = await keeperMonitorJob(jobData as any);
          break;
        default:
          console.warn(`[Worker] Unknown job type: ${job.name}`);
          result = null;
      }

      await completeJob(job.id);
      console.log(`[Worker] Job ${job.id} (${job.name}) completed`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Worker] Job ${job.id} (${job.name}) failed:`, errorMessage);
      await failJob(job.id, errorMessage);
    }

  } catch (error) {
    console.error('[Worker] Error in job processing loop:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Start the worker with LISTEN/NOTIFY and polling fallback
 */
async function startWorker() {
  // Set up LISTEN for instant notifications
  try {
    await startListener(() => {
      console.log('[Worker] Job notification received');
      processNextJob();
    });
  } catch (error) {
    console.error('[Worker] Failed to start LISTEN, will rely on polling:', error);
  }

  // Polling fallback (every 5 seconds) to catch missed notifications and process recurring jobs
  setInterval(async () => {
    try {
      await processRecurringJobs();
      await processNextJob();
    } catch (e) {
      console.error('[Worker] Polling error:', e);
    }
  }, 5000);

  console.log('[Worker] Listening for jobs via PostgreSQL (LISTEN + polling)...');
  
  // Process any existing jobs immediately
  await processNextJob();
}

// Start the worker
startWorker().catch((error) => {
  console.error('[Worker] Fatal error starting worker:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});
