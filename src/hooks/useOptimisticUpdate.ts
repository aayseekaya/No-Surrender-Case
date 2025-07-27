import { useState, useCallback } from 'react';
import { Card } from '@/types';

interface OptimisticUpdateOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useOptimisticUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateCardProgress = useCallback(async (
    cardId: string,
    newProgress: number,
    newLevel: number,
    newEnergy: number,
    options: OptimisticUpdateOptions = {}
  ) => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user',
        },
        body: JSON.stringify({ cardId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();
      options.onSuccess?.();
      return data;
    } catch (error) {
      options.onError?.(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const updateCardBatchProgress = useCallback(async (
    cardId: string,
    clicks: number,
    options: OptimisticUpdateOptions = {}
  ) => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/batch-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user',
        },
        body: JSON.stringify({ cardId, clicks }),
      });

      if (!response.ok) {
        throw new Error('Failed to update batch progress');
      }

      const data = await response.json();
      options.onSuccess?.();
      return data;
    } catch (error) {
      options.onError?.(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    updateCardProgress,
    updateCardBatchProgress,
    isUpdating,
  };
} 