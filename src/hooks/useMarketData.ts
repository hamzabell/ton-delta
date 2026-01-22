import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { MarketData } from '@/types/protocol';

export function useMarketData(pairId: string) {
  const { data, error, isLoading } = useSWR<MarketData>(
    pairId ? `/api/market/${pairId}` : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    data,
    isLoading,
    isError: error,
  };
}
