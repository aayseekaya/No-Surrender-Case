import { redisService, CACHE_KEYS } from './redis';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
  keyGenerator?: (req: any) => string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = CACHE_KEYS.RATE_LIMIT(identifier, 'default');
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Get current count from Redis
      const currentCount = await redisService.get(key);
      const count = currentCount ? parseInt(currentCount) : 0;

      // Check if we're in a new window
      if (count === 0) {
        await redisService.set(key, '1', Math.ceil(this.config.windowMs / 1000));
        return {
          success: true,
          remaining: this.config.maxRequests - 1,
          reset: now + this.config.windowMs,
          limit: this.config.maxRequests,
        };
      }

      // Check if limit exceeded
      if (count >= this.config.maxRequests) {
        const ttl = await redisService.get(`${key}:ttl`);
        const resetTime = ttl ? parseInt(ttl) : now + this.config.windowMs;
        
        return {
          success: false,
          remaining: 0,
          reset: resetTime,
          limit: this.config.maxRequests,
        };
      }

      // Increment counter
      const newCount = await redisService.increment(key);
      
      return {
        success: true,
        remaining: this.config.maxRequests - newCount,
        reset: now + this.config.windowMs,
        limit: this.config.maxRequests,
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        reset: now + this.config.windowMs,
        limit: this.config.maxRequests,
      };
    }
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = CACHE_KEYS.RATE_LIMIT(identifier, 'default');
    await redisService.del(key);
  }
}

// Predefined rate limiters
export const rateLimiters = {
  // Progress endpoint: 10 requests per minute
  progress: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }),

  // Level up endpoint: 5 requests per minute
  levelUp: new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  }),

  // Energy endpoint: 30 requests per minute
  energy: new RateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  }),

  // General API: 100 requests per minute
  general: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  }),
};

// Helper function to get client IP
export function getClientIP(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// Helper function to get user identifier
export function getUserIdentifier(req: any): string {
  // In a real app, you'd get this from JWT token or session
  const userId = req.headers['x-user-id'] || 'anonymous';
  const ip = getClientIP(req);
  return `${userId}:${ip}`;
} 