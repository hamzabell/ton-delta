"use client";

import { useState, useMemo } from "react";
import { Search, X, Check } from "lucide-react";
import { usePairs } from "@/hooks/usePairs";
import clsx from "clsx";

interface PositionFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPairId: string | null;
  onSelectPair: (pairId: string | null) => void;
}

export default function PositionFilterBottomSheet({
  isOpen,
  onClose,
  selectedPairId,
  onSelectPair,
}: PositionFilterBottomSheetProps) {
  const { pairs } = usePairs();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPairs = useMemo(() => {
    return pairs.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.baseToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.spotToken.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pairs, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-2xl bg-[#0B1221] rounded-t-3xl shadow-2xl h-[70vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 bg-[#0B1221] rounded-t-3xl z-10">
            <div className="w-12 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="px-6 pb-4 space-y-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">
                Filter Positions
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pairs..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-[#E2FF00]/50 transition-all font-medium"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
            <button
              onClick={() => {
                onSelectPair(null);
                onClose();
              }}
              className={clsx(
                "w-full p-4 rounded-xl flex items-center justify-between transition-all",
                selectedPairId === null
                  ? "bg-[#E2FF00]/10 border border-[#E2FF00]/20 text-[#E2FF00]"
                  : "bg-white/[0.03] border border-white/5 text-white hover:bg-white/[0.05]"
              )}
            >
              <span className="font-bold uppercase tracking-widest text-xs">
                All Positions
              </span>
              {selectedPairId === null && <Check className="w-4 h-4" />}
            </button>

            {filteredPairs.map((pair) => (
              <button
                key={pair.id}
                onClick={() => {
                  onSelectPair(pair.id);
                  onClose();
                }}
                className={clsx(
                  "w-full p-4 rounded-xl flex items-center justify-between transition-all group",
                  selectedPairId === pair.id
                    ? "bg-[#E2FF00]/10 border border-[#E2FF00]/20"
                    : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.05]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg text-white/40 font-bold border border-white/10">
                    {pair.icon.startsWith('http') ? (
                      <img src={pair.icon} alt={pair.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      pair.icon
                    )}
                  </div>
                  <div className="text-left">
                    <p className={clsx(
                        "font-bold text-sm uppercase italic tracking-tighter",
                        selectedPairId === pair.id ? "text-[#E2FF00]" : "text-white"
                    )}>
                      {pair.name}
                    </p>
                  </div>
                </div>
                {selectedPairId === pair.id && (
                  <Check className="w-4 h-4 text-[#E2FF00]" />
                )}
              </button>
            ))}
            
            {filteredPairs.length === 0 && (
                <div className="text-center py-8 text-white/20 text-xs font-bold uppercase tracking-widest">
                    No pairs found
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
