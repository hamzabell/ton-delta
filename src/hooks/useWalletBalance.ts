import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useTonWallet } from '@tonconnect/ui-react';

export function useWalletBalance() {
  const wallet = useTonWallet();
  const address = wallet?.account?.address;

  const { data, error, isLoading } = useSWR<{ balance: number }>(
    address ? `/api/wallet/balance?address=${address}` : null,
    fetcher,
    {
      revalidateOnFocus: true
    }
  );

  return {
    balance: data?.balance || 0,
    isLoading,
    isError: error,
    isConnected: !!wallet
  };
}
