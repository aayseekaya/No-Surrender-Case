import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/batch-progress';

// Mock security module
jest.mock('@/lib/security', () => ({
  withSecurity: (handler: any) => handler,
  DEFAULT_SECURITY_CONFIG: {
    maxRequestsPerMinute: 60,
    maxBatchClicks: 10,
    cooldownPeriod: 100,
  },
}));

describe('/api/batch-progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      status: 405,
    });
  });

  it('should handle batch progress with multiple clicks', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
        clicks: 5,
      },
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.progress).toBe(10); // 5 clicks * 2% = 10%
    expect(data.energy).toBe(95); // 100 - 5 = 95
  });

  it('should handle level up when progress reaches 100%', async () => {
    // First, get progress to 90% (45 clicks)
    for (let i = 0; i < 45; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cardId: 'test-card',
          clicks: 1,
        },
        headers: {
          'x-user-id': 'test-user',
        },
      });
      await handler(req, res);
    }

    // Then add 5 more clicks to trigger level up (90% + 10% = 100%)
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
        clicks: 5,
      },
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.progress).toBe(0); // Reset after level up
    expect(data.message).toContain('leveled up');
  });

  it('should reject requests with too many clicks', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
        clicks: 15, // More than max allowed
      },
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.code).toBe('BATCH_LIMIT_EXCEEDED');
  });

  it('should handle insufficient energy', async () => {
    // First, use most energy (95 clicks = 95 energy)
    for (let i = 0; i < 19; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cardId: 'test-card',
          clicks: 5,
        },
        headers: {
          'x-user-id': 'test-user',
        },
      });
      await handler(req, res);
    }

    // Then try to use more energy than available
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
        clicks: 10,
      },
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.code).toBe('INSUFFICIENT_ENERGY');
  });

  it('should handle missing cardId', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        clicks: 5,
      },
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.code).toBe('MISSING_CARD_ID');
  });

  it('should handle invalid clicks value', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
        clicks: -1,
      },
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.code).toBe('INVALID_REQUEST');
  });
}); 