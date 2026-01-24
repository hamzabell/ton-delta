import { ConnectionOptions } from 'bullmq';

// Use REDIS_URL if available (common in platform deployment and provided by Upstash)
let config: ConnectionOptions;

console.log(`[WorkerConfig] REDIS_URL present: ${!!process.env.REDIS_URL}`);
if (process.env.REDIS_URL) {
  // BullMQ / ioredis can often handle the URL string directly or we can use it to build the object.
  // For Upstash with TLS, sometimes just passing the URL is more reliable.
  config = {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: null,
    // Add default TLS for rediss
    tls: process.env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
  } as any;
} else {
  config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
}

export const redisConfig = config;
