"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { usePositions } from "@/hooks/usePositions";
import { usePairs } from "@/hooks/usePairs";
import PositionFilterBottomSheet from "./PositionFilterBottomSheet";
import PositionDetailsBottomSheet from "./PositionDetailsBottomSheet";
import clsx from "clsx";

interface PositionsListProps {
  onRefetch?: () => void;
}

const ITEMS_PER_PAGE = 5;

export default function PositionsList({ onRefetch }: PositionsListProps) {
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data Hooks
  const { positions, isLoading, createPosition } = usePositions(selectedPairId);
  const { pairs } = usePairs();

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [selectedPairId]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < positions.length) {
          setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [positions.length, visibleCount]);

  // Derived Values
  const visiblePositions = positions.slice(0, visibleCount);
  const selectedPair = pairs.find((p) => p.id === selectedPairId);

  // Helper to enrich position data
  const getEnrichedPosition = useCallback((pos: any) => {
    const pair = pairs.find(p => p.id === pos.pairId);
    return {
      icon: pair ? pair.icon : '?',
      pairName: pair ? pair.name : pos.pairId,
      value: pos.totalEquity,
      grossProfit: pos.totalEquity - (pos.principalFloor / 0.85),
      sessionExpiry: pos.createdAt ? new Date(pos.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000 : Date.now(),
    };
  }, [pairs]);

  const handleClosePosition = async (id: string) => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setSelectedPositionId(null);
      // In real implementation, call an API to close proper
      // await closePosition(id);
      if (onRefetch) onRefetch();
    }, 2000);
  };

  const handlePanic = async (id: string) => {
    setIsProcessing(true);
    // Simulate Panic API call
    setTimeout(() => {
        setIsProcessing(false);
        setSelectedPositionId(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
          Active Strategy Positions
        </h2>
        
        {/* Filter Dropdown Trigger */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
        >
          <span className={clsx(
              "text-[9px] font-bold uppercase tracking-widest",
              selectedPairId ? "text-[#E2FF00]" : "text-white/40"
          )}>
            {selectedPair ? selectedPair.name : "All Pairs"}
          </span>
          <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
        </button>
      </div>

      <div className="space-y-3 min-h-[300px]">
        {isLoading ? (
             <div className="flex justify-center py-12">
                 <Loader2 className="w-6 h-6 text-[#E2FF00] animate-spin" />
             </div>
        ) : visiblePositions.length > 0 ? (
          visiblePositions.map((pos) => {
            const enriched = getEnrichedPosition(pos);
            return (
                <button
                key={pos.id}
                onClick={() => setSelectedPositionId(pos.id)}
                className="w-full text-left p-6 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.04] transition-all relative overflow-hidden active:scale-[0.98]"
                >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white/20 border border-white/10 group-hover:border-[#E2FF00]/20 transition-all text-lg italic overflow-hidden">
                    {enriched.icon.startsWith('http') ? (
                        <img src={enriched.icon} alt={enriched.pairName} className="w-8 h-8 rounded-full" />
                    ) : (
                        enriched.icon
                    )}
                    </div>
                    <div>
                    <h3 className="font-black text-base text-white italic tracking-tighter uppercase whitespace-nowrap">
                        {enriched.pairName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-[#E2FF00] shadow-[0_0_8px_rgba(226,255,0,0.4)] animate-pulse" />
                        <span className="text-[8px] font-black text-[#E2FF00]/30 uppercase tracking-[0.2em] leading-none">
                        Active Position
                        </span>
                    </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className="font-black text-lg text-white italic tracking-tighter leading-none">
                    {enriched.value.toLocaleString()}{" "}
                    <span className="text-[10px] not-italic text-white/10 ml-0.5">
                        TON
                    </span>
                    </p>
                    <p className="text-[7px] text-white/20 font-black uppercase tracking-[0.4em] italic mt-2">
                    Tap to Manage
                    </p>
                </div>
                </button>
            ); 
          })
        ) : (
          <div className="p-12 text-center border border-dashed border-white/5 rounded-2xl">
            <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] italic leading-relaxed">
              No active positions found.
              {selectedPairId && <br/> && "Try selecting a different filter."}
            </p>
          </div>
        )}
        
        {/* Infinite Scroll Loader Target */}
        {visibleCount < positions.length && (
            <div ref={loaderRef} className="py-4 flex justify-center opacity-50">
                <div className="w-1 h-1 mx-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
                <div className="w-1 h-1 mx-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
                <div className="w-1 h-1 mx-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
            </div>
        )}
      </div>

      <PositionFilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedPairId={selectedPairId}
        onSelectPair={setSelectedPairId}
      />

      <PositionDetailsBottomSheet
        isOpen={!!selectedPositionId}
        onClose={() => setSelectedPositionId(null)}
        position={positions.find(p => p.id === selectedPositionId) || null}
        displayData={selectedPositionId ? getEnrichedPosition(positions.find(p => p.id === selectedPositionId)) : null}
        onClosePosition={handleClosePosition}
        onPanic={handlePanic}
        isProcessing={isProcessing}
      />
    </div>
  );
}
