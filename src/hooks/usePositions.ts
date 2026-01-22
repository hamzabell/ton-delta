import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Position } from '@/types/protocol';

export function usePositions(pairId?: string | null) {
  const url = pairId ? `/api/positions?pairId=${pairId}` : '/api/positions';
  const { data, error, mutate } = useSWR<{ positions: Position[] }>(url, fetcher, {
    revalidateOnFocus: false
  });

  const createPosition = async (pairId: string, capitalTON: number) => {
    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId, capitalTON }),
    });
    if (!res.ok) throw new Error('Failed to create position');
    mutate(); // Refresh list
    return res.json();
  };

  return {
    positions: data?.positions || [],
    isLoading: !data && !error,
    isError: error,
    createPosition,
    mutate
  };
}
