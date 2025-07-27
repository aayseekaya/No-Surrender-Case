import { createMocks } from 'node-mocks-http';
import batchProgressHandler from '@/pages/api/batch-progress';
import levelUpHandler from '@/pages/api/level-up';
import energyHandler from '@/pages/api/energy';

// Mock security module
jest.mock('@/lib/security', () => ({
  withSecurity: (handler: any) => handler,
  DEFAULT_SECURITY_CONFIG: {
    maxRequestsPerMinute: 60,
    maxBatchClicks: 10,
    cooldownPeriod: 100,
  },
}));

describe('Integration Tests - Complete User Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Card Development Workflow', () => {
    it('should complete full card development cycle', async () => {
      const cardId = 'integration-test-card';
      const userId = 'integration-test-user';

      // Step 1: Check initial energy
      const energyReq = createMocks({
        method: 'GET',
        headers: { 'x-user-id': userId },
      });
      await energyHandler(energyReq.req, energyReq.res);
      const energyData = JSON.parse(energyReq.res._getData());
      expect(energyData.success).toBe(true);
      expect(energyData.energy).toBe(100);

      // Step 2: Use batch processing to develop card efficiently
      const batchReq = createMocks({
        method: 'POST',
        body: { cardId, clicks: 10 },
        headers: { 'x-user-id': userId },
      });
      await batchProgressHandler(batchReq.req, batchReq.res);
      const batchData = JSON.parse(batchReq.res._getData());
      expect(batchData.success).toBe(true);
      expect(batchData.progress).toBe(20); // 10 clicks * 2% = 20%
      expect(batchData.energy).toBe(90); // 100 - 10 = 90

      // Step 3: Continue development with more batches
      for (let i = 0; i < 4; i++) {
        const req = createMocks({
          method: 'POST',
          body: { cardId, clicks: 10 },
          headers: { 'x-user-id': userId },
        });
        await batchProgressHandler(req.req, req.res);
        const data = JSON.parse(req.res._getData());
        expect(data.success).toBe(true);
      }

      // Step 4: Final batch to reach 100%
      const finalBatchReq = createMocks({
        method: 'POST',
        body: { cardId, clicks: 10 },
        headers: { 'x-user-id': userId },
      });
      await batchProgressHandler(finalBatchReq.req, finalBatchReq.res);
      const finalData = JSON.parse(finalBatchReq.res._getData());
      expect(finalData.success).toBe(true);
      expect(finalData.progress).toBe(0); // Should reset after level up
      expect(finalData.message).toContain('leveled up');

      // Step 5: Level up the card
      const levelUpReq = createMocks({
        method: 'POST',
        body: { cardId },
        headers: { 'x-user-id': userId },
      });
      await levelUpHandler(levelUpReq.req, levelUpReq.res);
      const levelUpData = JSON.parse(levelUpReq.res._getData());
      expect(levelUpData.success).toBe(true);
      expect(levelUpData.level).toBe(2);
      expect(levelUpData.progress).toBe(0);

      // Step 6: Check energy after all operations
      const finalEnergyReq = createMocks({
        method: 'GET',
        headers: { 'x-user-id': userId },
      });
      await energyHandler(finalEnergyReq.req, finalEnergyReq.res);
      const finalEnergyData = JSON.parse(finalEnergyReq.res._getData());
      expect(finalEnergyData.success).toBe(true);
      expect(finalEnergyData.energy).toBe(40); // 100 - 60 = 40
    });

    it('should handle energy depletion and regeneration', async () => {
      const cardId = 'energy-test-card';
      const userId = 'energy-test-user';

      // Use all energy
      for (let i = 0; i < 10; i++) {
        const req = createMocks({
          method: 'POST',
          body: { cardId, clicks: 10 },
          headers: { 'x-user-id': userId },
        });
        await batchProgressHandler(req.req, req.res);
      }

      // Try to use more energy (should fail)
      const failReq = createMocks({
        method: 'POST',
        body: { cardId, clicks: 1 },
        headers: { 'x-user-id': userId },
      });
      await batchProgressHandler(failReq.req, failReq.res);
      expect(failReq.res._getStatusCode()).toBe(400);

      const failData = JSON.parse(failReq.res._getData());
      expect(failData.code).toBe('INSUFFICIENT_ENERGY');

      // Check energy regeneration (mock time passing)
      const originalDateNow = Date.now;
      const mockTime = Date.now() + (2 * 60 * 1000); // 2 minutes later
      Date.now = jest.fn(() => mockTime);

      const energyReq = createMocks({
        method: 'GET',
        headers: { 'x-user-id': userId },
      });
      await energyHandler(energyReq.req, energyReq.res);
      const energyData = JSON.parse(energyReq.res._getData());
      expect(energyData.success).toBe(true);
      expect(energyData.energy).toBeGreaterThan(0); // Should have regenerated

      Date.now = originalDateNow;
    });

    it('should handle multiple cards simultaneously', async () => {
      const userId = 'multi-card-user';
      const cardIds = ['card-1', 'card-2', 'card-3'];

      // Develop all cards simultaneously
      const promises = cardIds.map(async (cardId) => {
        const req = createMocks({
          method: 'POST',
          body: { cardId, clicks: 5 },
          headers: { 'x-user-id': userId },
        });
        await batchProgressHandler(req.req, req.res);
        return JSON.parse(req.res._getData());
      });

      const results = await Promise.all(promises);

      // All cards should be developed successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.progress).toBe(10); // 5 clicks * 2% = 10%
      });
    });

    it('should handle rate limiting in real workflow', async () => {
      const cardId = 'rate-limit-test';
      const userId = 'rate-limit-user';

      // Make rapid requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 15; i++) {
        const req = createMocks({
          method: 'POST',
          body: { cardId, clicks: 1 },
          headers: { 'x-user-id': userId },
        });
        requests.push(batchProgressHandler(req.req, req.res));
      }

      await Promise.all(requests);

      // Some requests should succeed, some should be rate limited
      const successCount = requests.filter(req => req.res._getStatusCode() === 200).length;
      const rateLimitedCount = requests.filter(req => req.res._getStatusCode() === 429).length;

      expect(successCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should handle edge cases in workflow', async () => {
      const cardId = 'edge-case-test';
      const userId = 'edge-case-user';

      // Test with maximum allowed clicks
      const maxClicksReq = createMocks({
        method: 'POST',
        body: { cardId, clicks: 10 }, // Maximum allowed
        headers: { 'x-user-id': userId },
      });
      await batchProgressHandler(maxClicksReq.req, maxClicksReq.res);
      expect(maxClicksReq.res._getStatusCode()).toBe(200);

      // Test with more than maximum clicks (should fail)
      const tooManyClicksReq = createMocks({
        method: 'POST',
        body: { cardId, clicks: 15 }, // More than maximum
        headers: { 'x-user-id': userId },
      });
      await batchProgressHandler(tooManyClicksReq.req, tooManyClicksReq.res);
      expect(tooManyClicksReq.res._getStatusCode()).toBe(400);

      // Test with invalid cardId
      const invalidCardReq = createMocks({
        method: 'POST',
        body: { cardId: '', clicks: 5 },
        headers: { 'x-user-id': userId },
      });
      await batchProgressHandler(invalidCardReq.req, invalidCardReq.res);
      expect(invalidCardReq.res._getStatusCode()).toBe(400);

      // Test with negative clicks
      const negativeClicksReq = createMocks({
        method: 'POST',
        body: { cardId, clicks: -1 },
        headers: { 'x-user-id': userId },
      });
      await batchProgressHandler(negativeClicksReq.req, negativeClicksReq.res);
      expect(negativeClicksReq.res._getStatusCode()).toBe(400);
    });

    it('should maintain data consistency across operations', async () => {
      const cardId = 'consistency-test';
      const userId = 'consistency-user';

      // Track progress through multiple operations
      let currentProgress = 0;
      let currentEnergy = 100;

      // Perform multiple batch operations
      for (let i = 0; i < 5; i++) {
        const req = createMocks({
          method: 'POST',
          body: { cardId, clicks: 5 },
          headers: { 'x-user-id': userId },
        });
        await batchProgressHandler(req.req, req.res);

        const data = JSON.parse(req.res._getData());
        expect(data.success).toBe(true);

        // Verify progress calculation
        if (data.progress === 0) {
          // Level up occurred
          currentProgress = 0;
        } else {
          currentProgress = data.progress;
        }

        // Verify energy calculation
        currentEnergy = data.energy;
        expect(currentEnergy).toBeGreaterThanOrEqual(0);
        expect(currentEnergy).toBeLessThanOrEqual(100);
      }

      // Verify final state
      expect(currentProgress).toBeGreaterThanOrEqual(0);
      expect(currentProgress).toBeLessThanOrEqual(100);
      expect(currentEnergy).toBeGreaterThanOrEqual(0);
      expect(currentEnergy).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle network errors gracefully', async () => {
      const cardId = 'network-error-test';
      const userId = 'network-error-user';

      // Simulate network error by mocking fetch to throw
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const req = createMocks({
        method: 'POST',
        body: { cardId, clicks: 5 },
        headers: { 'x-user-id': userId },
      });

      // Should not crash the application
      await expect(batchProgressHandler(req.req, req.res)).resolves.not.toThrow();

      global.fetch = originalFetch;
    });

    it('should handle invalid responses gracefully', async () => {
      const cardId = 'invalid-response-test';
      const userId = 'invalid-response-user';

      const req = createMocks({
        method: 'POST',
        body: { cardId, clicks: 5 },
        headers: { 'x-user-id': userId },
      });

      // Should handle the request without crashing
      await expect(batchProgressHandler(req.req, req.res)).resolves.not.toThrow();
    });
  });
}); 