import useSWR from 'swr';
import { Card } from '@/types';

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-user-id': 'demo-user',
  },
}).then(res => res.json());

export function useCards() {
  const { data, error, isLoading, mutate } = useSWR<{ cards: Card[]; success: boolean }>(
    '/api/cards',
    fetcher,
    {
      refreshInterval: 5000, // 5 saniyede bir yenile
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    cards: data?.cards || [],
    isLoading,
    error,
    mutate,
  };
}

export function useEnergy() {
  const { data, error, isLoading, mutate } = useSWR<{ energy: number; regenerationTime: number; success: boolean }>(
    '/api/energy',
    fetcher,
    {
      refreshInterval: 1000, // 1 saniyede bir yenile
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    energy: data?.energy || 0,
    regenerationTime: data?.regenerationTime || 0,
    isLoading,
    error,
    mutate,
  };
} 