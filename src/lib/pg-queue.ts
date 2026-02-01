import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

/**
 * PostgreSQL-based Job Queue
 * Replaces Redis/BullMQ with LISTEN/NOTIFY and FOR UPDATE SKIP LOCKED
 */

export interface JobOptions {
  priority?: number;
  scheduledFor?: Date;
  maxAttempts?: number;
  recurring?: boolean;
  cronPattern?: string;
}

interface Job {
  id: string;
  name: string;
  payload: Prisma.JsonValue;
  status: string;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  error?: string | null;
}

/**
 * Enqueue a new job
 */
export async function enqueueJob(
  name: string,
  payload: Record<string, unknown> = {},
  options: JobOptions = {}
): Promise<string> {
  const job = await prisma.job.create({
    data: {
      name,
      payload: payload as any, // Cast to any for Prisma JsonValue compatibility
      priority: options.priority ?? 0,
      scheduledFor: options.scheduledFor ?? new Date(),
      maxAttempts: options.maxAttempts ?? 3,
      recurring: options.recurring ?? false,
      cronPattern: options.cronPattern,
    },
  });

  // Trigger NOTIFY to wake up workers
  await notifyNewJob();

  return job.id;
}

/**
 * Atomically claim the next available job using FOR UPDATE SKIP LOCKED
 */
export async function dequeueJob(): Promise<Job | null> {
  try {
    // Use raw SQL for FOR UPDATE SKIP LOCKED support
    const jobs = await prisma.$queryRaw<Job[]>`
      UPDATE "Job"
      SET status = 'processing', "processedAt" = NOW(), attempts = attempts + 1
      WHERE id = (
        SELECT id FROM "Job"
        WHERE status = 'pending'
          AND "scheduledFor" <= NOW()
        ORDER BY priority DESC, "scheduledFor" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;

    return jobs.length > 0 ? jobs[0] : null;
  } catch (error) {
    console.error('[PgQueue] Error dequeueing job:', error);
    return null;
  }
}

/**
 * Mark a job as completed
 * For recurring jobs, automatically enqueue the next instance
 */
export async function completeJob(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  
  if (!job) return;

  // Mark as completed
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      lastRun: new Date(), // Update lastRun for recurring jobs
    },
  });

  // If recurring, immediately enqueue next instance
  if (job.recurring && job.cronPattern) {
    const nextRun = getNextCronRun(job.cronPattern, new Date());
    
    await prisma.job.create({
      data: {
        name: job.name,
        payload: job.payload as any,
        priority: job.priority,
        scheduledFor: nextRun,
        maxAttempts: job.maxAttempts,
        recurring: false, // Individual instances are not recurring
        status: 'pending',
      },
    });

    await notifyNewJob();
  }
}

/**
 * Mark a job as failed and handle retries
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  
  if (!job) return;

  const shouldRetry = job.attempts < job.maxAttempts;

  if (shouldRetry) {
    // Exponential backoff: 30s, 60s, 120s
    const delaySeconds = Math.min(30 * Math.pow(2, job.attempts - 1), 300);
    const scheduledFor = new Date(Date.now() + delaySeconds * 1000);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'pending',
        error,
        scheduledFor,
      },
    });

    await notifyNewJob();
  } else {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error,
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Schedule a recurring job
 */
export async function scheduleRecurringJob(
  name: string,
  payload: Record<string, unknown> = {},
  cronPattern: string
): Promise<string> {
  // Check if this recurring job already exists
  const existing = await prisma.job.findFirst({
    where: {
      name,
      recurring: true,
      cronPattern,
    },
  });

  if (existing) {
    console.log(`[PgQueue] Recurring job ${name} already scheduled`);
    return existing.id;
  }

  return enqueueJob(name, payload, {
    recurring: true,
    cronPattern,
  });
}

/**
 * Process recurring jobs - check if any are due and enqueue them
 */
export async function processRecurringJobs(): Promise<void> {
  const recurringJobs = await prisma.job.findMany({
    where: {
      recurring: true,
      status: 'completed',
    },
  });

  for (const job of recurringJobs) {
    if (!job.cronPattern || !job.lastRun) continue;

    const nextRun = getNextCronRun(job.cronPattern, job.lastRun);
    
    if (nextRun <= new Date()) {
      // Create a new job instance
      await enqueueJob(
        job.name,
        job.payload as Record<string, unknown>,
        { priority: job.priority }
      );

      // Update last run
      await prisma.job.update({
        where: { id: job.id },
        data: { lastRun: new Date() },
      });
    }
  }
}

/**
 * Parse cron pattern and get next run time
 * Simplified for common patterns (supports seconds)
 */
function getNextCronRun(pattern: string, lastRun: Date): Date {
  // Parse pattern like "*/30 * * * * *" (every 30 seconds)
  const parts = pattern.split(' ');
  
  if (parts.length !== 6) {
    console.warn('[PgQueue] Invalid cron pattern, defaulting to 60s');
    return new Date(lastRun.getTime() + 60000);
  }

  const seconds = parts[0];
  
  // Handle */X format (every X seconds/minutes)
  if (seconds.startsWith('*/')) {
    const interval = parseInt(seconds.substring(2));
    return new Date(lastRun.getTime() + interval * 1000);
  }

  // Default fallback
  return new Date(lastRun.getTime() + 60000);
}

/**
 * Trigger PostgreSQL NOTIFY to wake up listening workers
 */
async function notifyNewJob(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`NOTIFY job_notify, 'new_job'`);
  } catch (error) {
    // NOTIFY might fail in some connection pool scenarios, that's OK
    // Workers will poll anyway
    console.debug('[PgQueue] NOTIFY failed (workers will poll):', error);
  }
}

/**
 * Start listening for job notifications
 * Returns a cleanup function to stop listening
 */
export async function startListener(onJob: () => void): Promise<() => void> {
  // We need a dedicated connection for LISTEN
  // This requires using the pg library directly
  const { Client } = require('pg');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  // Set up LISTEN
  await client.query('LISTEN job_notify');

  client.on('notification', (msg: { channel: string }) => {
    if (msg.channel === 'job_notify') {
      onJob();
    }
  });

  console.log('[PgQueue] Listening for job notifications via PostgreSQL LISTEN');

  // Return cleanup function
  return async () => {
    await client.query('UNLISTEN job_notify');
    await client.end();
  };
}

/**
 * Clean up old completed/failed jobs (run periodically)
 */
export async function cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const result = await prisma.job.deleteMany({
    where: {
      status: { in: ['completed', 'failed'] },
      completedAt: { lt: cutoff },
      recurring: false, // Don't delete recurring job templates
    },
  });

  return result.count;
}
