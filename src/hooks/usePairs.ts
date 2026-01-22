import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useEffect } from 'react';
import { fetcher } from '@/lib/fetcher';
import { TradingPair } from '@/types/protocol';

interface PairsResponse {
  pairs: TradingPair[];
  totalTVL: number;
  hasMore: boolean;
  totalPages: number;
  currentPage: number;
}

export function usePairs() {
  const { data, error, isLoading } = useSWR<PairsResponse>('/api/pairs?limit=60', fetcher, {
    refreshInterval: 30000,
  });

  return {
    pairs: data?.pairs || [],
    totalTVL: data?.totalTVL || 0,
    isLoading,
    isError: error,
  };
}

export function usePairsInfinite(limit = 5, sortBy = 'tvl', order = 'desc') {
  const getKey = (pageIndex: number, previousPageData: PairsResponse) => {
    // If we have previous data and we've reached the last page, don't fetch anymore
    if (previousPageData && (previousPageData.currentPage >= previousPageData.totalPages)) return null;
    return `/api/pairs?page=${pageIndex + 1}&limit=${limit}&sortBy=${sortBy}&order=${order}`; // SWR key
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite<PairsResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    parallel: false // Ensure sequential fetching if multiple pages needed (though we want to stop that)
  });

  // Reset page size when sort params change
  useEffect(() => {
    setSize(1);
  }, [sortBy, order, setSize]);

  // Flatten pairs and deduplicate by ID to prevent key errors
  const allPairs = data ? data.flatMap(batch => batch.pairs) : [];
  const uniquePairsMap = new Map();
  allPairs.forEach(pair => {
    if (!uniquePairsMap.has(pair.id)) {
      uniquePairsMap.set(pair.id, pair);
    }
  });
  const pairs = Array.from(uniquePairsMap.values());
  const totalTVL = data && data[0] ? data[0].totalTVL : 0;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.pairs?.length === 0;
  
  // Robust check for end of list using totalPages from backend
  const lastPageData = data?.[data.length - 1];
  const isReachingEnd = isEmpty || (lastPageData && lastPageData.currentPage >= lastPageData.totalPages);

  return {
    pairs,
    totalTVL,
    isLoading: isLoading && !data, // Initial Load
    isLoadingMore,
    isError: error,
    loadMore: () => setSize(size + 1),
    hasMore: !isReachingEnd,
    refresh: () => mutate()
  };
}

export function usePair(id: string) {
  // Fetch full metadata from standard pairs endpoint filtered by ID
  const { data, error, isLoading } = useSWR<TradingPair>(id ? `/api/pairs?id=${id.toLowerCase()}` : null, fetcher, {
    revalidateOnFocus: false, // Don't revalidate constantly
    dedupingInterval: 60000   // Cache result for 1 min
  });

  return { 
    pair: data, 
    isLoading, 
    isError: error 
  };
}
