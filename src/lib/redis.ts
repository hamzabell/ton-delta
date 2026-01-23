import Redis from 'ioredis';
import { redisConfig } from '../workers/config';

// Create a centralized Redis client for the application
const redis = new Redis({
  ...redisConfig,
  // Add retry strategy for robustness
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null // Required for BullMQ reuse in some contexts, helpful general practice
});

redis.on('error', (err) => {
    // Suppress connection Refused errors in non-production to avoid console spam if redis isn't running
    if (process.env.NODE_ENV === 'development' && err.message.includes('ECONNREFUSED')) {
        return; 
    }
    console.error('[Redis] Client Error:', err);
});

export default redis;
