import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/progress';

describe('/api/progress', () => {
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

  it('should handle progress update', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
      },
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.progress).toBe(2); // 2% increase
    expect(data.energy).toBe(99); // 100 - 1 = 99
  });

  it('should handle missing cardId', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
      headers: {
        'x-user-id': 'test-user',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Card ID is required',
      code: 'MISSING_CARD_ID',
      status: 400,
    });
  });

  it('should handle insufficient energy', async () => {
    // First, use all energy (100 clicks)
    for (let i = 0; i < 100; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cardId: 'test-card',
        },
        headers: {
          'x-user-id': 'test-user',
        },
      });
      await handler(req, res);
    }

    // Then try to use more energy
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
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

  it('should handle level up when progress reaches 100%', async () => {
    // First, get progress to 98% (49 clicks)
    for (let i = 0; i < 49; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cardId: 'test-card',
        },
        headers: {
          'x-user-id': 'test-user',
        },
      });
      await handler(req, res);
    }

    // Then add 1 more click to trigger level up
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardId: 'test-card',
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
}); 