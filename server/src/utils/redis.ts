import { Redis } from 'ioredis';
import { env } from './env';

let instance: Redis | null = null;

export function getRedis(): Redis {
  if (!instance) {
    instance = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    instance.on('error', (err) => console.error('[Redis] error:', err));
  }
  return instance;
}
