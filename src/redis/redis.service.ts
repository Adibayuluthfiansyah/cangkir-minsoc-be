import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly DEFAULT_LOCK_TTL = 30;
  private readonly DEFAULT_LOCK_RETRY_DELAY = 100;
  private readonly DEFAULT_LOCK_RETRY_COUNT = 50;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST') || 'localhost',
      port: this.config.get<number>('REDIS_PORT') || 6379,
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      db: this.config.get<number>('REDIS_DB') || 0,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  // Lua script to acquire lock
  async acquireLock(
    key: string,
    ttl: number = this.DEFAULT_LOCK_TTL,
    retryCount: number = this.DEFAULT_LOCK_RETRY_COUNT,
    retryDelay: number = this.DEFAULT_LOCK_RETRY_DELAY,
  ): Promise<string | null> {
    const lockId = `${Date.now()}-${Math.random()}`;

    for (let i = 0; i < retryCount; i++) {
      const result = await this.client.set(key, lockId, 'EX', ttl, 'NX');

      if (result === 'OK') {
        return lockId;
      }

      // wait before retry with exponential backoff
      const delay = retryDelay * Math.pow(1.5, Math.min(i, 5));
      await this.sleep(delay);
    }

    return null;
  }

  // Lua script to release lock
  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.client.eval(script, 1, key, lockId);
    return result === 1;
  }

  // Atomic lock
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.DEFAULT_LOCK_TTL,
  ): Promise<T> {
    const lockId = await this.acquireLock(key, ttl);

    if (!lockId) {
      throw new Error(`Failed to acquire lock for key: ${key}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(key, lockId);
    }
  }

  // Atomic sequence
  async incrementSequence(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
