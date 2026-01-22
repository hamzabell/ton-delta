"use client";

import { useState } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Position } from "@/types/protocol";

interface PositionDetailsBottomSheetProps {
  position: Position | null; // Using the raw Position type or detailed type
  // Enriched position data for display
  displayData?: {
    icon: string;
    pairName: string;
    value: number;
    grossProfit: number;
    sessionExpiry: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onClosePosition: (id: string) => void;
  onPanic: (id: string) => void;
  isProcessing: boolean;
}

export default function PositionDetailsBottomSheet({
  position,
  displayData,
  isOpen,
  onClose,
  onClosePosition,
  onPanic,
  isProcessing
}: PositionDetailsBottomSheetProps) {
  if (!isOpen || !displayData || !position) return null;

  const daysLeft = Math.max(
    0,
    Math.floor((displayData.sessionExpiry - Date.now()) / (24 * 60 * 60 * 1000))
  );

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-t-3xl p-8 shadow-2xl h-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white/30 border border-white/10 text-lg italic overflow-hidden">
                {displayData.icon.startsWith('http') ? (
                  <img src={displayData.icon} alt={displayData.pairName} className="w-8 h-8 rounded-full" />
                ) : (
                  displayData.icon
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter leading-none">
                  {displayData.pairName}
                </h3>
                <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-widest mt-1">
                  Institutional Vault
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-white/5 rounded-2xl space-y-1">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                Principal Value
              </p>
              <p className="text-lg font-black text-white italic font-mono">
                {displayData.value.toLocaleString()} TON
              </p>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl space-y-1">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                Accumulated Yield
              </p>
              <p className="text-lg font-black text-[#E2FF00] italic font-mono">
                +{displayData.grossProfit.toLocaleString()} TON
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-4 mb-10">
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
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pb-8">
            <button
              onClick={() => onClosePosition(position.id)}
              disabled={isProcessing}
              className="py-5 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
            >
              {isProcessing ? "Processing..." : "Close & Settle"}
            </button>
            <button
              onClick={() => onPanic(position.id)}
              disabled={isProcessing}
              className="py-5 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)] flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              PANIC EXIT
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
