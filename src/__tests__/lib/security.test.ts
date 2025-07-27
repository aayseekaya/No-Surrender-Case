import { SecurityManager, withSecurity, DEFAULT_SECURITY_CONFIG } from '@/lib/security';
import { NextApiRequest, NextApiResponse } from 'next';

// Mock NextApiRequest and NextApiResponse
const createMockRequest = (overrides: Partial<NextApiRequest> = {}): NextApiRequest => ({
  method: 'POST',
  body: { cardId: 'test-card' },
  headers: {
    'x-user-id': 'test-user',
    'x-forwarded-for': '127.0.0.1',
  },
  env: {},
  ...overrides,
} as NextApiRequest);

const createMockResponse = (): NextApiResponse => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  } as any;
  return res;
};

describe('SecurityManager', () => {
  let securityManager: SecurityManager;

  beforeEach(() => {
    securityManager = SecurityManager.getInstance();
    // Clear any existing data
    (securityManager as any).requestCounts.clear();
    (securityManager as any).cooldowns.clear();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const identifier = 'test-user:127.0.0.1';
      const config = { ...DEFAULT_SECURITY_CONFIG, maxRequestsPerMinute: 5 };

      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        expect(securityManager.checkRateLimit(identifier, config)).toBe(true);
      }

      // 6th request should be blocked
      expect(securityManager.checkRateLimit(identifier, config)).toBe(false);
    });

    it('should reset rate limit after 1 minute', () => {
      const identifier = 'test-user:127.0.0.1';
      const config = { ...DEFAULT_SECURITY_CONFIG, maxRequestsPerMinute: 1 };

      // First request should be allowed
      expect(securityManager.checkRateLimit(identifier, config)).toBe(true);

      // Second request should be blocked
      expect(securityManager.checkRateLimit(identifier, config)).toBe(false);

      // Mock time passing (1 minute + 1 second)
      const now = Date.now() + 61000;
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Request should be allowed again
      expect(securityManager.checkRateLimit(identifier, config)).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('Cooldown System', () => {
    it('should enforce cooldown period', () => {
      const identifier = 'test-user:127.0.0.1';
      const config = { ...DEFAULT_SECURITY_CONFIG, cooldownPeriod: 1000 };

      // First request should be allowed
      expect(securityManager.checkCooldown(identifier, config)).toBe(true);

      // Second request within cooldown should be blocked
      expect(securityManager.checkCooldown(identifier, config)).toBe(false);

      // Mock time passing (1 second + 1ms)
      const now = Date.now() + 1001;
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Request should be allowed again
      expect(securityManager.checkCooldown(identifier, config)).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('Batch Clicks Validation', () => {
    it('should validate batch clicks correctly', () => {
      const config = { ...DEFAULT_SECURITY_CONFIG, maxBatchClicks: 10 };

      // Valid clicks
      expect(securityManager.validateBatchClicks(1, config)).toBe(true);
      expect(securityManager.validateBatchClicks(5, config)).toBe(true);
      expect(securityManager.validateBatchClicks(10, config)).toBe(true);

      // Invalid clicks
      expect(securityManager.validateBatchClicks(0, config)).toBe(false);
      expect(securityManager.validateBatchClicks(-1, config)).toBe(false);
      expect(securityManager.validateBatchClicks(11, config)).toBe(false);
      expect(securityManager.validateBatchClicks(100, config)).toBe(false);
    });
  });

  describe('Client Identifier', () => {
    it('should generate correct client identifier', () => {
      const req = createMockRequest();
      const identifier = securityManager.getClientIdentifier(req);

      expect(identifier).toBe('test-user:127.0.0.1');
    });

    it('should handle missing user ID', () => {
      const req = createMockRequest({ headers: { 'x-forwarded-for': '127.0.0.1' } });
      const identifier = securityManager.getClientIdentifier(req);

      expect(identifier).toBe('anonymous:127.0.0.1');
    });

    it('should handle missing IP', () => {
      const req = createMockRequest({ headers: {} });
      const identifier = securityManager.getClientIdentifier(req);

      expect(identifier).toBe('test-user:unknown');
    });
  });

  describe('IP Address Detection', () => {
    it('should detect x-forwarded-for header', () => {
      const req = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      });

      const ip = securityManager.getClientIP(req);
      expect(ip).toBe('192.168.1.1');
    });

    it('should detect x-real-ip header', () => {
      const req = createMockRequest({
        headers: { 'x-real-ip': '192.168.1.2' }
      });

      const ip = securityManager.getClientIP(req);
      expect(ip).toBe('192.168.1.2');
    });

    it('should fallback to connection remote address', () => {
      const req = createMockRequest({
        connection: { remoteAddress: '192.168.1.3' }
      });

      const ip = securityManager.getClientIP(req);
      expect(ip).toBe('192.168.1.3');
    });

    it('should fallback to socket remote address', () => {
      const req = createMockRequest({
        socket: { remoteAddress: '192.168.1.4' }
      });

      const ip = securityManager.getClientIP(req);
      expect(ip).toBe('192.168.1.4');
    });

    it('should return unknown for missing IP', () => {
      const req = createMockRequest({ headers: {} });

      const ip = securityManager.getClientIP(req);
      expect(ip).toBe('unknown');
    });
  });

  describe('Request Body Validation', () => {
    it('should validate valid request body', () => {
      const validBody = { cardId: 'test-card' };
      const result = securityManager.validateRequestBody(validBody);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate request body with clicks', () => {
      const validBody = { cardId: 'test-card', clicks: 5 };
      const result = securityManager.validateRequestBody(validBody);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject missing body', () => {
      const result = securityManager.validateRequestBody(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Request body is required');
    });

    it('should reject missing cardId', () => {
      const invalidBody = { clicks: 5 };
      const result = securityManager.validateRequestBody(invalidBody);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Valid cardId is required');
    });

    it('should reject empty cardId', () => {
      const invalidBody = { cardId: '' };
      const result = securityManager.validateRequestBody(invalidBody);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Valid cardId is required');
    });

    it('should reject invalid clicks type', () => {
      const invalidBody = { cardId: 'test-card', clicks: 'invalid' };
      const result = securityManager.validateRequestBody(invalidBody);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Clicks must be a positive number');
    });

    it('should reject negative clicks', () => {
      const invalidBody = { cardId: 'test-card', clicks: -1 };
      const result = securityManager.validateRequestBody(invalidBody);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Clicks must be a positive number');
    });

    it('should reject zero clicks', () => {
      const invalidBody = { cardId: 'test-card', clicks: 0 };
      const result = securityManager.validateRequestBody(invalidBody);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Clicks must be a positive number');
    });
  });
});

describe('withSecurity Middleware', () => {
  let mockHandler: jest.Mock;
  let req: NextApiRequest;
  let res: NextApiResponse;

  beforeEach(() => {
    mockHandler = jest.fn();
    req = createMockRequest();
    res = createMockResponse();
  });

  it('should call handler for valid request', async () => {
    const securedHandler = withSecurity(mockHandler);
    
    await securedHandler(req, res);

    expect(mockHandler).toHaveBeenCalledWith(req, res);
  });

  it('should block request when rate limit exceeded', async () => {
    const config = { ...DEFAULT_SECURITY_CONFIG, maxRequestsPerMinute: 1 };
    const securedHandler = withSecurity(mockHandler, config);
    
    // First request should pass
    await securedHandler(req, res);
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Second request should be blocked
    await securedHandler(req, res);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
    });
  });

  it('should block request when cooldown is active', async () => {
    const config = { ...DEFAULT_SECURITY_CONFIG, cooldownPeriod: 1000 };
    const securedHandler = withSecurity(mockHandler, config);
    
    // First request should pass
    await securedHandler(req, res);
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Second request should be blocked
    await securedHandler(req, res);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Please wait before making another request.',
      code: 'COOLDOWN_ACTIVE',
      status: 429,
    });
  });

  it('should validate request body for POST requests', async () => {
    const securedHandler = withSecurity(mockHandler);
    
    // Invalid request body
    req.body = null;
    
    await securedHandler(req, res);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Request body is required',
      code: 'INVALID_REQUEST',
      status: 400,
    });
  });

  it('should not validate request body for non-POST requests', async () => {
    const securedHandler = withSecurity(mockHandler);
    
    req.method = 'GET';
    req.body = null;
    
    await securedHandler(req, res);

    expect(mockHandler).toHaveBeenCalledWith(req, res);
  });
}); 