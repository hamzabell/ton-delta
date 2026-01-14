import { Queue } from 'bullmq';
import { redisConfig } from './config';

export const QUEUE_NAMES = {
  FUNDING: 'funding-harvester',
  RISK: 'risk-manager',
  DEPOSIT: 'deposit-processor',
};

// Create Queues (for producers to add jobs)
export const fundingQueue = new Queue(QUEUE_NAMES.FUNDING, { connection: redisConfig });
export const riskQueue = new Queue(QUEUE_NAMES.RISK, { connection: redisConfig });
export const depositQueue = new Queue(QUEUE_NAMES.DEPOSIT, { connection: redisConfig });
