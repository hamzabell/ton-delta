import { ConnectionOptions } from 'bullmq';

// Use REDIS_URL if available (common in platform deployment and provided by Upstash)
let config: ConnectionOptions;

console.log(`[WorkerConfig] REDIS_URL present: ${!!process.env.REDIS_URL}`);
if (process.env.REDIS_URL) {
  try {
    const url = new URL(process.env.REDIS_URL);
    config = {
      host: url.hostname,
      port: Number(url.port),
      username: url.username || undefined,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {
        rejectUnauthorized: false 
      } : undefined,
      maxRetriesPerRequest: null,
    };
  } catch (e) {
    console.error('Failed to parse REDIS_URL:', e);
    // Fallback to defaults
    config = {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null
    };
  }
} else {
  config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
}

export const redisConfig = config;
