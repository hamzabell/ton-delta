"use client";

import { useTonWallet } from "@tonconnect/ui-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { usePositions } from "@/hooks/usePositions";
import { usePairs } from "@/hooks/usePairs";
import PositionsList from "@/components/PositionsList";

export default function PortfolioPage() {
  const wallet = useTonWallet();
  const { balance: walletBalance } = useWalletBalance();
  
  // Fetch everything purely for the Ledger summary
  // Optimization: In real app, might want a specific stats endpoint 
  // instead of fetching full list just for sums.
  const { positions: apiPositions, mutate } = usePositions();
  const { pairs } = usePairs();

  const positions = apiPositions.map(pos => {
    const pair = pairs.find(p => p.id === pos.pairId);
    const initialEstimate = pos.principalFloor / 0.85; 
    return {
      id: pos.id,
      pair: pair ? pair.name : pos.pairId,
      value: pos.totalEquity,
      grossProfit: pos.totalEquity - initialEstimate,
    };
  });

  // Profit Sharing Calculations (20% Cut)
  const totalGrossProfit = positions.reduce(
    (acc, pos) => acc + pos.grossProfit,
    0,
  );
  const performanceFee = totalGrossProfit * 0.2;

  const institutionalEquity = positions.reduce(
    (acc, pos) => acc + pos.value,
    0,
  );
  const netEquity = institutionalEquity - performanceFee;

  // We only show data if wallet is connected? Or always show protocol stats?
  // Requirements were to remove "wallet connection status". 
  // We'll show the data if available, or dashes if not.
  const isConnected = !!wallet;

  return (
    <div className="space-y-8 pb-24">
      
      {/* 1. Capital Ledger (Moved to Top) */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">
          Capital Ledger
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">
              Net Equity
            </p>
            <p className="text-lg font-black text-white font-mono italic leading-none">
              {isConnected ? netEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"} TON
            </p>
             {!isConnected && <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-2">Connect Wallet</p>}
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">
              Liquid Wallet
            </p>
            <p className="text-lg font-black text-white/20 font-mono italic leading-none">
              {isConnected ? walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"} TON
            </p>
            {!isConnected && <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-2">---</p>}
          </div>
        </div>
      </div>

      {/* 2. Header: Total Net Balance Summary (Optional, but kept for high-level view) */}
      <div className="space-y-1 px-1">
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
          Total Net Assets
        </p>
        <h1 className="text-4xl font-black text-white italic tracking-tighter">
          {isConnected ? (netEquity + walletBalance).toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
          }) : "---"}
          <span className="text-xl ml-2 not-italic text-white/20">TON</span>
        </h1>
        {totalGrossProfit > 0 && (
            <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#E2FF00] font-black uppercase tracking-widest italic">
                +{totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON Yield Harvested
            </span>
            </div>
        )}
      </div>

      {/* 3. Positions List (New Component) */}
      {isConnected ? (
        <PositionsList onRefetch={mutate}/>
      ) : (
         // Simple empty state if not connected, without the big "Connect" button block which we removed.
         <div className="p-12 text-center border border-dashed border-white/5 rounded-2xl mt-8">
            <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] italic leading-relaxed">
              Connect wallet to view strategy positions.
            </p>
         </div>
      )}

    </div>
  );
}
