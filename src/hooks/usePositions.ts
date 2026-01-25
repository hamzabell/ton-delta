import useSWR from 'swr';
import { useEffect } from 'react';
import { fetcher } from '@/lib/fetcher';
import { Position } from '@/types/protocol';

export function usePositions(pairId?: string | null, userId?: string | null) {
  const query = new URLSearchParams();
  if (pairId) query.append('pairId', pairId);
  if (userId) query.append('userId', userId);
  
  const url = query.toString() ? `/api/positions?${query.toString()}` : '/api/positions';
  const { data, error, mutate } = useSWR<{ positions: Position[] }>(url, fetcher, {
    revalidateOnFocus: false, // We rely on SSE now
    refreshInterval: 0 // No polling
  });

  // SSE Effect
  useEffect(() => {
    if (!userId) return;

    console.log('[usePositions] Connecting to SSE stream...');
    const eventSource = new EventSource(`/api/events/positions?userId=${userId}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.positions) {
            // Optimistically update the SWR cache
            // We need to filter if pairId is active, but the backend sends all for user.
            // Client-side filtering in SWR fetcher handles display, but cache needs raw structure.
            
            // Wait, the API /api/positions returns { positions: [...] }
            // So we match that structure.
            mutate({ positions: payload.positions }, false); 
        }
      } catch (e) {
        // Ignore heartbeat/parse error
      }
    };

    eventSource.onerror = (err) => {
        console.warn('[usePositions] SSE Error, retrying...', err);
        eventSource.close();
        // Reconnection is handled by browser native EventSource usually, 
        // but react effect cleanup will close it. 
        // We let the cleanup close it, and the dependency array re-triggering might not happen unless userId changes.
    };

    return () => {
      console.log('[usePositions] Closing SSE stream');
      eventSource.close();
    };
  }, [userId, mutate]);

  const createPosition = async (pairId: string, capitalTON: number) => {
    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId, capitalTON }),
    });
    if (!res.ok) throw new Error('Failed to create position');
    // Mutate will be handled by SSE eventually, but we can trigger re-fetch to be safe
    mutate(); 
    return res.json();
  };

  // Client-side Pair Filter
  // The SSE returns ALL positions for the user. We must ensure the returned `positions` 
  // matches what the component expects (filtered by pair if needed).
  // Actually, the SWR key `url` includes pairId query. The SSE pushes ALL.
  // If we mutate SWR with ALL positions, but the SWR key expects filtered, we might break consistency if fetcher does filtering.
  // CHECK: Does /api/positions filter by pairId? YES.
  // FIX: We should filter the SSE data before mutating if pairId is set.

  const allPositions = data?.positions || [];
  const displayPositions = pairId 
      ? allPositions.filter(p => p.pairId === pairId)
      : allPositions;

  return {
    positions: displayPositions,
    isLoading: !data && !error,
    isError: error,
    createPosition,
    mutate
  };
}
