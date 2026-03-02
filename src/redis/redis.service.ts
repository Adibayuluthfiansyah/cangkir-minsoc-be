import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly DEFAULT_LOCK_TTL = 30;
  private readonly DEFAULT_LOCK_RETRY_DELAY = 100;
  private readonly DEFAULT_LOCK_RETRY_COUNT = 50;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const upstashUrl = this.config.get<string>('UPSTASH_REDIS_REST_URL');
    const upstashToken = this.config.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (!upstashUrl || !upstashToken) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set',
      );
    }

    this.client = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });

    console.log('✅ Redis REST Client Initialized');
    console.log('🔧 Redis Configuration:', {
      url: upstashUrl,
      hasToken: !!upstashToken,
    });

    // Test connection
    this.client
      .ping()
      .then(() => {
        console.log('✅ Redis REST Client Connected - PING successful');
      })
      .catch((err) => {
        console.error('❌ Redis REST Client Connection Failed:', err.message);
      });
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
      // Upstash REST API: set with NX and EX options
      const result = await this.client.set(key, lockId, {
        nx: true,
        ex: ttl,
      });

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

    const result = await this.client.eval(script, [key], [lockId]);
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
      // Upstash REST API: set with EX option
      await this.client.set(key, value, { ex: ttl });
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
