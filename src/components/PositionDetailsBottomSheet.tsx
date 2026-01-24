"use client";

import { useState, useMemo } from "react";
import { X, Clock, AlertTriangle, ExternalLink, RefreshCw, Shield } from "lucide-react";
import clsx from "clsx";
import { Position } from "@/types/protocol";

interface PositionDetailsBottomSheetProps {
  position: Position | null;
  displayData?: {
    icon: string;
    pairName: string;
    value: number;
    grossProfit: number;
    sessionExpiry: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onClosePosition?: (id: string) => void; // Deprecated but kept for compat if needed, though we should remove
  onPanic?: (id: string) => void;         // Deprecated
  onExit: (id: string) => void;
  isProcessing: boolean;
}

export default function PositionDetailsBottomSheet({
  position,
  displayData,
  isOpen,
  onClose,
  onExit,
  isProcessing
}: PositionDetailsBottomSheetProps) {
  if (!isOpen || !displayData || !position) return null;

  const [now] = useState(() => Date.now());
  const daysLeft = Math.max(
    0,
    Math.floor((displayData.sessionExpiry - now) / (24 * 60 * 60 * 1000))
  );

  const isMaxLossTriggered = position.totalEquity < position.principalFloor;
  const lastRebalanced = position.lastRebalanced ? new Date(position.lastRebalanced).toLocaleString() : "Never";
  const ticker = position.pairId.split('-')[0].toUpperCase();

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-t-3xl p-8 shadow-2xl h-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white/30 border border-white/10 text-lg italic overflow-hidden">
                {displayData.icon.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayData.icon} alt={displayData.pairName} className="w-8 h-8 rounded-full" />
                ) : (
                  displayData.icon
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter leading-none">
                  {displayData.pairName}
                </h3>
                  <div className="flex gap-2 mt-2">
                    <span className={clsx(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                        position.status === 'active' ? "bg-[#E2FF00]/10 text-[#E2FF00]" :
                        position.status.includes('stasis') ? "bg-blue-500/10 text-blue-400" :
                        "bg-white/10 text-white/40"
                    )}>
                        {position.status === 'active' ? 'Basis Mode' : 
                         position.status === 'stasis_active' ? 'Stasis (Staked)' : 
                         position.status === 'stasis' ? 'Stasis (Cash)' : 
                         position.status === 'stasis_pending_stake' ? 'Stasis (Pending)' : 
                         position.status === 'pending_entry' ? 'Pending Entry' : 'Closed'}
                    </span>
                  </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Max Loss Warning */}
          {isMaxLossTriggered && (
             <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
                 <div>
                     <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Max Loss Triggered</p>
                     <p className="text-[10px] text-red-400/80 mt-0.5">Equity is below principal floor. Panic exit recommended.</p>
                 </div>
             </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-5 bg-white/5 rounded-2xl space-y-1">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                Principal Value
              </p>
              <p className="text-lg font-black text-white italic font-mono">
                {displayData.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
              </p>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl space-y-1">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                Accumulated Yield
              </p>
              <p className={clsx("text-lg font-black italic font-mono", displayData.grossProfit >= 0 ? "text-[#E2FF00]" : "text-red-400")}>
                {displayData.grossProfit >= 0 ? "+" : ""}{displayData.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
              </p>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">
                {((displayData.grossProfit / displayData.value) * 100).toFixed(2)}% Growth
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-3 mb-8">
            <div className="px-5 py-4 border border-white/5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Session Key Expiry
                </span>
              </div>
              <span className="text-[11px] font-black text-white italic">
                {daysLeft}D Left
              </span>
            </div>

            <div className="px-5 py-4 border border-white/5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Last Rebalanced
                </span>
              </div>
              <span className="text-[11px] font-black text-white italic">
                {lastRebalanced}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                 <a href={`https://swap.coffee/dex?pair=${ticker}_TON`} target="_blank" rel="noreferrer" 
                    className="px-5 py-4 border border-white/5 bg-white/[0.02] rounded-2xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors group">
                     <span className="text-[10px] font-bold text-white/40 group-hover:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                         Spot <ExternalLink className="w-3 h-3" />
                     </span>
                 </a>
                 <a href={`https://storm.trade/ton/futures/${ticker}-TON`} target="_blank" rel="noreferrer" 
                    className="px-5 py-4 border border-white/5 bg-white/[0.02] rounded-2xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors group">
                     <span className="text-[10px] font-bold text-white/40 group-hover:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                         Short <ExternalLink className="w-3 h-3" />
                     </span>
                 </a>
            </div>


            {position.status === 'stasis_active' && (
                 <a href={`https://tonviewer.com/${position.vaultAddress || position.user?.walletAddress}`} target="_blank" rel="noreferrer"
                    className="w-full px-5 py-4 border border-blue-500/20 bg-blue-500/5 rounded-2xl flex items-center justify-between hover:bg-blue-500/10 transition-colors group">
                     <div className="flex items-center gap-3">
                         <Shield className="w-4 h-4 text-blue-400" />
                         <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                            View Liquid Stake Asset
                         </span>
                     </div>
                     <ExternalLink className="w-3 h-3 text-blue-400" />
                 </a>
            )}

            {position.status === 'closed' && (
                 <a href={`https://tonviewer.com/${position.vaultAddress || position.user?.walletAddress}`} target="_blank" rel="noreferrer"
                    className="w-full px-5 py-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex items-center justify-between hover:bg-emerald-500/10 transition-colors group">
                     <div className="flex items-center gap-3">
                         <ExternalLink className="w-4 h-4 text-emerald-400" />
                         <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            View Exit Activity
                         </span>
                     </div>
                     <ExternalLink className="w-3 h-3 text-emerald-400" />
                 </a>
            )}
          </div>



          {/* Actions */}
            <button
              onClick={() => onExit(position.id)}
              disabled={isProcessing || position.status === 'closed' || position.status === 'processing_exit'}
              className="w-full py-5 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                  <>Processing Exit...</>
              ) : position.status === 'processing_exit' ? (
                  <>Exit Pending Verification...</>
              ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Exit Position
                  </>
              )}
            </button>
          </div>
        </div>
    </>
  );
}
