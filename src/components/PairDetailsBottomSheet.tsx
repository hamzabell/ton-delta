"use client";

import { useState } from "react";
import {
  X,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { usePair } from "@/hooks/usePairs";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface PairDetailsBottomSheetProps {
  pairId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEnterPosition: (amount: string) => void;
}

export default function PairDetailsBottomSheet({
  pairId,
  isOpen,
  onClose,
  onEnterPosition,
}: PairDetailsBottomSheetProps) {
  const { balance, isConnected, isLoading } = useWalletBalance();
  
  // Real Data Hooks
  const { pair, isLoading: isPairLoading } = usePair(pairId || "");

  const [amount, setAmount] = useState("");

  if (!isOpen || !pairId) return null;
  
  const currentYield = pair ? `${pair.apr}%` : "";

  return (
    <>
      {/* Backdrop - Always show immediately when open */}
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
  
      {/* Loading indicator at bottom while fetching */}
      {(isPairLoading || !pair) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-[#0B1221] border border-white/10 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/10 border-t-[#E2FF00] rounded-full animate-spin" />
            <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Loading...</span>
          </div>
        </div>
      )}

      {/* Bottom Sheet - Only show when data loaded */}
      {!isPairLoading && pair && (
      <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-2xl bg-[#0B1221] rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto pb-28">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-[#0B1221] z-10">
            <div className="w-12 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-lg font-bold text-white tracking-tight italic uppercase">
                  {pair.spotToken} / {pair.baseToken}
                </h1>
                <p className="text-[9px] text-[#E2FF00] font-bold uppercase tracking-widest italic">
                  TON Native Yield
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Yield Summary Card - Compact */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">
                  Target Yield
                </p>
                <p className="text-2xl font-black text-white italic tracking-tighter">
                  {currentYield}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">
                  Risk
                </p>
                <p
                  className={clsx(
                    "text-sm font-black uppercase italic",
                    pair.risk === "Low" ? "text-emerald-500" : "text-amber-500",
                  )}
                >
                  {pair.risk}
                </p>
              </div>
            </div>

            {/* Main Input Section - Compact */}
            <div className="space-y-4">
              <div className="text-center space-y-3 py-4">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  Delegation Amount (TON)
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-light text-white/20">T</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-4xl font-black text-white text-center w-full focus:outline-none placeholder-white/5 italic"
                  />
                </div>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
                  {isLoading ? 'Loading balance...' : isConnected ? `Balance: ${!isNaN(balance) ? balance.toFixed(2) : '0.00'} TON` : "Connect Wallet"}
                </p>
              </div>

              {/* Action Button - Compact */}
              <button
                onClick={() => onEnterPosition(amount)}
                disabled={!amount || (isConnected && balance === 0)}
                className={clsx(
                  "w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                  !amount || (isConnected && balance === 0)
                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                    : "bg-[#E2FF00] text-[#020617] shadow-[0_10px_30px_rgba(226,255,0,0.15)] hover:scale-[1.02]",
                )}
              >
                Enter Position <Zap className="w-4 h-4" />
              </button>
              
              {isConnected && balance === 0 && (
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest text-center mt-2 animate-pulse">
                  Insufficient Balance. Please Fund Wallet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
