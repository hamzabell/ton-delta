import { Redis as UpstashRedis } from '@upstash/redis';
import Redis from 'ioredis';
import { redisConfig } from '../workers/config';

// Universal Redis Client Export using explicit singleton pattern
// We favor Upstash HTTP client for Next.js Serverless/Edge environments (standard API routes)
// We favor IORedis (TCP) for long-running processes (workers) or if specifically configured.

// Universal Redis Client Export using explicit singleton pattern
// We favor Upstash HTTP client for Next.js Serverless/Edge environments (standard API routes)
// We favor IORedis (TCP) for long-running processes (workers) or if specifically configured.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any;

// Check if we should use Upstash HTTP
const useUpstashHttp = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

if (useUpstashHttp) {
    redisClient = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
} else {
    // Fallback to IORedis (TCP)
    redisClient = new Redis(process.env.REDIS_URL || {
        ...redisConfig,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: null
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redisClient.on('error', (err: any) => {
        if (process.env.NODE_ENV === 'development' && err?.message?.includes('ECONNREFUSED')) {
            return;
        }
        console.error('[Redis] Client Error:', err);
    });
}

export default redisClient;
