"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { usePositions } from "@/hooks/usePositions";
import { usePairs } from "@/hooks/usePairs";
import PositionFilterBottomSheet from "./PositionFilterBottomSheet";
import PositionDetailsBottomSheet from "./PositionDetailsBottomSheet";
import clsx from "clsx";

import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";

interface PositionsListProps {
  onRefetch?: () => void;
  userId?: string | null;
}

const ITEMS_PER_PAGE = 5;

export default function PositionsList({ onRefetch, userId: propUserId }: PositionsListProps) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const userId = propUserId || wallet?.account.address;
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data Hooks
  const { positions, isLoading, createPosition } = usePositions(selectedPairId, userId);
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
  const [filterStatus, setFilterStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');

  // Derived Values
  const filteredPositions = positions.filter(p => {
    if (filterStatus === 'OPEN') return p.status !== 'closed';
    return p.status === 'closed';
  });
  
  const visiblePositions = filteredPositions.slice(0, visibleCount);
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

  const handleExit = async (id: string, actionType: 'CLOSE' | 'PANIC') => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/positions/${id}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionType === 'PANIC' ? 'USER_PANIC' : 'USER_CLOSE' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate exit');
      }

      if (data.transaction) {
          // User needs to sign
          await tonConnectUI.sendTransaction(data.transaction);
          
          // SUCCESS: User signed. Now we update the status optimistically.
          await fetch(`/api/positions/${id}/confirm-exit`, { method: 'POST' });

          alert("Transition sent! Your position will face liquidation and the remaining funds will be swept to your wallet.");
      } else {
          // Fallback just in case (if API did it automatically? unlikely with current flow)
          const explorerLink = data.explorerLink || '';
          alert(`Exit Initiated Successfully!\n\nTransaction: ${data.txHash}\n\nView on explorer:\n${explorerLink}\n\n${data.message}`);
      }
      
      setSelectedPositionId(null);
      // Force refetch to update UI
      if (onRefetch) {
        onRefetch();
      } else {
        window.location.reload();
      }

    } catch (error) {
      console.error('Exit Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to exit position');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClosePosition = (id: string) => handleExit(id, 'CLOSE');
  const handlePanic = (id: string) => handleExit(id, 'PANIC');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-4">
             <button 
                onClick={() => setFilterStatus('OPEN')}
                className={clsx(
                    "text-[10px] font-bold uppercase tracking-[0.3em] transition-colors",
                    filterStatus === 'OPEN' ? "text-white" : "text-white/20 hover:text-white/40"
                )}
             >
                Active
             </button>
             <button 
                onClick={() => setFilterStatus('CLOSED')}
                className={clsx(
                    "text-[10px] font-bold uppercase tracking-[0.3em] transition-colors",
                    filterStatus === 'CLOSED' ? "text-white" : "text-white/20 hover:text-white/40"
                )}
             >
                Closed
             </button>
        </div>
        
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
                        <div className={clsx(
                            "w-1 h-1 rounded-full shadow-[0_0_8px_rgba(226,255,0,0.4)] animate-pulse",
                            pos.status === 'processing_exit' || pos.status === 'exit_monitoring' ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : 
                            pos.status === 'closed' ? "bg-white/20 shadow-none animate-none" : "bg-[#E2FF00]"
                        )} />
                        <span className={clsx(
                            "text-[8px] font-black uppercase tracking-[0.2em] leading-none",
                            pos.status === 'processing_exit' ? "text-orange-500/50" : 
                            pos.status === 'closed' ? "text-white/20" : "text-[#E2FF00]/30"
                        )}>
                        {pos.status === 'processing_exit' || pos.status === 'exit_monitoring' ? "Processing Exit" : 
                         pos.status === 'closed' ? "Closed Position" : "Active Position"}
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
        onExit={(id) => handleExit(id, 'PANIC')} // Unified exit (Panic/Universal)
        isProcessing={isProcessing}
      />
    </div>
  );
}
