import { Queue } from 'bullmq';
import { redisConfig } from './config';

export const QUEUE_NAMES = {
  FUNDING: 'funding-harvester',
  RISK: 'risk-manager',
  DEPOSIT: 'deposit-processor',
  BASIS: 'basis-manager',
  WATCHMAN: 'watchman',
};

// Create Queues (for producers to add jobs)
export const fundingQueue = new Queue(QUEUE_NAMES.FUNDING, { connection: redisConfig });
export const riskQueue = new Queue(QUEUE_NAMES.RISK, { connection: redisConfig });
export const depositQueue = new Queue(QUEUE_NAMES.DEPOSIT, { connection: redisConfig });
export const basisQueue = new Queue(QUEUE_NAMES.BASIS, { connection: redisConfig });
export const watchmanQueue = new Queue(QUEUE_NAMES.WATCHMAN, { connection: redisConfig });

