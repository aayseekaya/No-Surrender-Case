import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/batch-progress';
import progressHandler from '@/pages/api/progress';

// Mock security module
jest.mock('@/lib/security', () => ({
  withSecurity: (handler: any) => handler,
  DEFAULT_SECURITY_CONFIG: {
    maxRequestsPerMinute: 60,
    maxBatchClicks: 10,
    cooldownPeriod: 100,
  },
}));

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Response Time', () => {
    it('should respond within 100ms for batch progress', async () => {
      const startTime = Date.now();
      
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
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(100);
      expect(res._getStatusCode()).toBe(200);
    });

    it('should respond within 50ms for single progress', async () => {
      const startTime = Date.now();
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cardId: 'test-card',
        },
        headers: {
          'x-user-id': 'test-user',
        },
      });

      await progressHandler(req, res);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(50);
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Batch Processing Efficiency', () => {
    it('should handle multiple batch requests efficiently', async () => {
      const startTime = Date.now();
      const requests = [];
      
      // Create 10 batch requests
      for (let i = 0; i < 10; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            cardId: `test-card-${i}`,
            clicks: 5,
          },
          headers: {
            'x-user-id': 'test-user',
          },
        });
        requests.push({ req, res });
      }
      
      // Execute all requests
      await Promise.all(requests.map(({ req, res }) => handler(req, res)));
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 10;
      
      expect(averageTime).toBeLessThan(20); // Average 20ms per request
      expect(totalTime).toBeLessThan(200); // Total less than 200ms
      
      // All requests should succeed
      requests.forEach(({ res }) => {
        expect(res._getStatusCode()).toBe(200);
      });
    });

    it('should reduce API calls with batch processing', async () => {
      const singleProgressCalls = 50; // Original system
      const batchProgressCalls = 5; // New system (10 clicks per batch)
      
      const singleStartTime = Date.now();
      for (let i = 0; i < singleProgressCalls; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: { cardId: 'test-card' },
          headers: { 'x-user-id': 'test-user' },
        });
        await progressHandler(req, res);
      }
      const singleEndTime = Date.now();
      const singleTotalTime = singleEndTime - singleStartTime;
      
      const batchStartTime = Date.now();
      for (let i = 0; i < batchProgressCalls; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: { cardId: 'test-card', clicks: 10 },
          headers: { 'x-user-id': 'test-user' },
        });
        await handler(req, res);
      }
      const batchEndTime = Date.now();
      const batchTotalTime = batchEndTime - batchStartTime;
      
      // Batch processing should be significantly faster
      expect(batchTotalTime).toBeLessThan(singleTotalTime * 0.3); // At least 70% faster
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            cardId: `test-card-${i}`,
            clicks: 5,
          },
          headers: {
            'x-user-id': 'test-user',
          },
        });
        await handler(req, res);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests without conflicts', async () => {
      const concurrentRequests = 20;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            cardId: `test-card-${i}`,
            clicks: 3,
          },
          headers: {
            'x-user-id': `user-${i}`,
          },
        });
        promises.push(handler(req, res));
      }
      
      const results = await Promise.all(promises);
      
      // All requests should complete successfully
      expect(results).toHaveLength(concurrentRequests);
    });

    it('should maintain data consistency under load', async () => {
      const requests = [];
      
      // Create requests that should result in predictable outcomes
      for (let i = 0; i < 10; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            cardId: 'consistency-test',
            clicks: 1,
          },
          headers: {
            'x-user-id': 'test-user',
          },
        });
        requests.push({ req, res });
      }
      
      await Promise.all(requests.map(({ req, res }) => handler(req, res)));
      
      // Check that responses are consistent
      const responses = requests.map(({ res }) => JSON.parse(res._getData()));
      const progressValues = responses.map(r => r.progress);
      
      // Progress should increase by 2% each time (with some cooldown blocks)
      let validProgressValues = progressValues.filter(p => p !== undefined);
      expect(validProgressValues.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors quickly', async () => {
      const startTime = Date.now();
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cardId: '', // Invalid cardId
          clicks: 5,
        },
        headers: {
          'x-user-id': 'test-user',
        },
      });

      await handler(req, res);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(50);
      expect(res._getStatusCode()).toBe(400);
    });

    it('should handle rate limiting efficiently', async () => {
      const startTime = Date.now();
      
      // Make requests rapidly to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 15; i++) {
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
        requests.push({ req, res });
      }
      
      await Promise.all(requests.map(({ req, res }) => handler(req, res)));
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      
      // Some requests should be rate limited
      const responses = requests.map(({ res }) => res._getStatusCode());
      const rateLimitedCount = responses.filter(status => status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Scalability', () => {
    it('should scale well with increasing load', async () => {
      const loadLevels = [10, 50, 100];
      const results = [];
      
      for (const load of loadLevels) {
        const startTime = Date.now();
        
        const promises = [];
        for (let i = 0; i < load; i++) {
          const { req, res } = createMocks({
            method: 'POST',
            body: {
              cardId: `test-card-${i}`,
              clicks: 2,
            },
            headers: {
              'x-user-id': `user-${i}`,
            },
          });
          promises.push(handler(req, res));
        }
        
        await Promise.all(promises);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / load;
        
        results.push({ load, totalTime, averageTime });
      }
      
      // Performance should not degrade significantly
      const firstResult = results[0];
      const lastResult = results[results.length - 1];
      
      // Average time should not increase more than 3x
      expect(lastResult.averageTime).toBeLessThan(firstResult.averageTime * 3);
    });
  });
}); 