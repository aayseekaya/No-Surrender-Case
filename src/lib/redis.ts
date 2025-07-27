import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;

  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis connection failed:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = await this.connect();
      return await client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    try {
      const client = await this.connect();
      if (expireSeconds) {
        await client.setEx(key, expireSeconds, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.connect();
      await client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.connect();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async increment(key: string): Promise<number> {
    try {
      const client = await this.connect();
      return await client.incr(key);
    } catch (error) {
      console.error('Redis increment error:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      const client = await this.connect();
      await client.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();

// Cache keys
export const CACHE_KEYS = {
  USER_ENERGY: (userId: string) => `user:energy:${userId}`,
  USER_CARDS: (userId: string) => `user:cards:${userId}`,
  CARD_PROGRESS: (cardId: string) => `card:progress:${cardId}`,
  RATE_LIMIT: (userId: string, action: string) => `rate:${action}:${userId}`,
} as const; 