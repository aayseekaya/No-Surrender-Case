import { NextApiRequest, NextApiResponse } from 'next';

export interface SecurityConfig {
  maxRequestsPerMinute: number;
  maxBatchClicks: number;
  cooldownPeriod: number; // milliseconds
}

export class SecurityManager {
  private static instance: SecurityManager;
  private requestCounts: Map<string, { count: number; lastReset: number }> = new Map();
  private cooldowns: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Rate limiting
  checkRateLimit(identifier: string, config: SecurityConfig): boolean {
    const now = Date.now();
    const userRequests = this.requestCounts.get(identifier);

    if (!userRequests || now - userRequests.lastReset > 60000) {
      // Reset counter if 1 minute has passed
      this.requestCounts.set(identifier, { count: 1, lastReset: now });
      return true;
    }

    if (userRequests.count >= config.maxRequestsPerMinute) {
      return false;
    }

    userRequests.count++;
    return true;
  }

  // Cooldown system
  checkCooldown(identifier: string, config: SecurityConfig): boolean {
    const now = Date.now();
    const lastAction = this.cooldowns.get(identifier);

    if (!lastAction || now - lastAction > config.cooldownPeriod) {
      this.cooldowns.set(identifier, now);
      return true;
    }

    return false;
  }

  // Validate batch clicks
  validateBatchClicks(clicks: number, config: SecurityConfig): boolean {
    return clicks >= 1 && clicks <= config.maxBatchClicks;
  }

  // Get client identifier
  getClientIdentifier(req: NextApiRequest): string {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const ip = this.getClientIP(req);
    return `${userId}:${ip}`;
  }

  // Get client IP
  getClientIP(req: NextApiRequest): string {
    return (
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.headers['x-real-ip']?.toString() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  // Validate request body
  validateRequestBody(body: any): { valid: boolean; error?: string } {
    if (!body) {
      return { valid: false, error: 'Request body is required' };
    }

    if (typeof body.cardId !== 'string' || body.cardId.trim() === '') {
      return { valid: false, error: 'Valid cardId is required' };
    }

    if (body.clicks !== undefined) {
      if (typeof body.clicks !== 'number' || body.clicks < 1) {
        return { valid: false, error: 'Clicks must be a positive number' };
      }
    }

    return { valid: true };
  }
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxRequestsPerMinute: 60,
  maxBatchClicks: 10,
  cooldownPeriod: 100, // 100ms cooldown between actions
};

// Security middleware
export function withSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const securityManager = SecurityManager.getInstance();
    const identifier = securityManager.getClientIdentifier(req);

    // Check rate limiting
    if (!securityManager.checkRateLimit(identifier, config)) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429,
      });
    }

    // Check cooldown
    if (!securityManager.checkCooldown(identifier, config)) {
      return res.status(429).json({
        message: 'Please wait before making another request.',
        code: 'COOLDOWN_ACTIVE',
        status: 429,
      });
    }

    // Validate request body for POST requests
    if (req.method === 'POST') {
      const validation = securityManager.validateRequestBody(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          message: validation.error,
          code: 'INVALID_REQUEST',
          status: 400,
        });
      }
    }

    // Call the original handler
    return handler(req, res);
  };
} 