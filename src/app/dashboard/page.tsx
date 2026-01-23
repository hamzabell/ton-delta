"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Shield, Flame, Info, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePairsInfinite } from '@/hooks/usePairs';
import PairDetailsBottomSheet from "@/components/PairDetailsBottomSheet";
import DelegationBottomSheet from "@/components/DelegationBottomSheet";

export default function OpportunitiesPage() {
  const [sortBy, setSortBy] = useState<'tvl' | 'yield'>('tvl');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [showDelegationSheet, setShowDelegationSheet] = useState(false);
  const [delegationPairId, setDelegationPairId] = useState<string | null>(null);
  const [delegationAmount, setDelegationAmount] = useState<string>("");

  // Pull to Refresh Logic
  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullChange, setPullChange] = useState(0);
  const isRefreshing = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartPoint(e.targetTouches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && pullStartPoint > 0) {
      const touchY = e.targetTouches[0].clientY;
      const diff = touchY - pullStartPoint;
      if (diff > 0) {
        setPullChange(diff);
        // Prevent default only if we are pulling down significantly to avoid interfering with normal scroll too much
        // Note: preventing default here might block vertical scrolling if not careful
      }
    }
  };

  const onTouchEnd = async () => {
    if (pullChange > 100 && !isRefreshing.current) {
        isRefreshing.current = true;
        // Trigger refresh
        await refresh(); 
        isRefreshing.current = false;
    }
    setPullStartPoint(0);
    setPullChange(0);
  };
  
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HOT' | 'CONSERVATIVE' | 'HIGH_YIELD'>('ALL');

  // Fetch sorted data directly from backend with Filters
  const { pairs, totalTVL, isLoading, loadMore, hasMore, isLoadingMore, refresh } = usePairsInfinite(5, sortBy, sortOrder, activeFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

  // Client-side filtering only for Search (on the fetched chunks)
  // We rely on backend for Category/Risk filtering now to fix Infinite Scroll
  const filteredPairs = pairs.filter(pair => 
    pair.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pair.baseToken?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.spotToken?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // Prevent multiple calls if already loading
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    }, { threshold: 0.1 }); // Trigger slightly earlier to be smooth, but check loading state

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore, isLoadingMore]);

  const handleEnterPosition = (amount: string) => {
    setShowDelegationSheet(true);
    setDelegationPairId(selectedPairId);
    setDelegationAmount(amount);
    setSelectedPairId(null);
  }

  const handleDelegationClose = () => {
    setShowDelegationSheet(false);
    setDelegationPairId(null);
    setDelegationAmount("");
  }

  const handleDelegationBack = () => {
    setShowDelegationSheet(false);
    setSelectedPairId(delegationPairId);
    setDelegationAmount("");
  }

  return (
    <div 
        className="space-y-12 pb-24 min-h-screen relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none transition-transform duration-200 z-50"
        style={{ transform: `translateY(${Math.min(pullChange / 2, 80)}px)`, opacity: pullChange > 0 ? 1 : 0 }}
      >
          <div className="bg-[#E2FF00] text-black p-2 rounded-full shadow-lg">
             {pullChange > 100 ? <ArrowDown className="w-5 h-5 animate-bounce" /> : <ArrowDown className="w-5 h-5" />}
          </div>
      </div>

      {/* AA Wallet Status Indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">
            W5 Account Active
          </p>
        </div>
        <p className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-widest leading-none">
          Restricted Session Live
        </p>
      </div>

      {/* Ultra-Simple Header */}
      <div className="space-y-1">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
            REFINER
          </h1>
          <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-[0.2em]">
            Institutional Meme Alpha
          </p>
      </div>

      {/* Search & Statistics Breakdown to allow Sticky behavior */}
      
      {/* Sticky Search Header */}
      {/* Adjusted top offset to top-24 (96px) to align perfectly below the fixed header */}
      <div className="sticky top-24 z-30 bg-[#020617]/95 backdrop-blur-xl py-4 -mx-2 px-2 border-b border-white/5 shadow-2xl shadow-black/50 transition-all">
        <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {/* Search Icon */}
                <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text"
                placeholder="Search assets (e.g. DOGS, NOT)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-[#E2FF00]/50 transition-all font-medium"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                 <button 
                    onClick={() => setActiveFilter('ALL')}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap",
                        activeFilter === 'ALL' 
                            ? "bg-white text-[#020617] border-white" 
                            : "bg-white/5 text-white/40 border-white/5"
                    )}
                 >
                    All
                 </button>
                 <button 
                    onClick={() => setActiveFilter('HOT')}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-1",
                        activeFilter === 'HOT' 
                            ? "bg-orange-500 text-white border-orange-500" 
                            : "bg-white/5 text-white/40 border-white/5"
                    )}
                 >
                    <Flame className="w-3 h-3" /> Hot
                 </button>
                 <button 
                    onClick={() => setActiveFilter('CONSERVATIVE')}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-1",
                        activeFilter === 'CONSERVATIVE' 
                            ? "bg-emerald-500 text-white border-emerald-500" 
                            : "bg-white/5 text-white/40 border-white/5"
                    )}
                 >
                    <Shield className="w-3 h-3" /> Conservative
                 </button>
            </div>


            {/* Sort Toggle */}
            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar h-8">
                     <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                        Sort by:
                     </p>
                    <button 
                        onClick={() => setSortBy('tvl')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                             sortBy === 'tvl' ? "text-white" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        TVL
                    </button>
                    <button 
                        onClick={() => setSortBy('yield')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                             sortBy === 'yield' ? "text-[#E2FF00]" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        Yield
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-px h-6 bg-white/10" />
                    <button
                        onClick={toggleSortOrder}
                        className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-white/60"
                    >
                        {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
      </div>



      {/* List */}
      <div className="space-y-6">
        {isLoading && pairs.length === 0 ? (
             <div className="text-white/20 text-sm">Loading pairs...</div>
        ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPairs.map((pair) => (
            <button
              key={pair.id}
              onClick={() => setSelectedPairId(pair.id)}
              className="group p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.05] transition-all text-left w-full active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold text-base overflow-hidden">
                    {pair.icon.startsWith('http') ? (
                        <img src={pair.icon} alt={pair.name} className="w-full h-full object-cover" />
                    ) : (
                        pair.icon
                    )}
                    </div>
                    {pair.isHot && (
                        <div className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white p-0.5 rounded-full border-2 border-[#0B1221] z-10">
                            <Flame className="w-3 h-3 fill-white" />
                        </div>
                    )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white leading-none">
                        {pair.name.split('/')[0].trim()}
                      </h3>
                      {pair.risk === 'Conservative' && (
                           <Shield className="w-3 h-3 text-emerald-500 fill-emerald-500/20" />
                      )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">
                            Funding (1h)
                        </span>
                        <span className="text-[10px] font-medium text-white/60 leading-none">
                            { (pair.fundingRate * 100).toFixed(4) }%
                        </span>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">
                            TVL
                        </span>
                         <span className="text-[10px] font-medium text-white/60 leading-none">
                           {pair.liquidity >= 1000000 
                             ? `${(pair.liquidity / 1000000).toFixed(1)}M` 
                             : pair.liquidity >= 1000 
                               ? `${(pair.liquidity / 1000).toFixed(0)}k` 
                               : pair.liquidity.toFixed(0)
                           }
                         </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/5 group-hover:bg-[#E2FF00] group-hover:border-[#E2FF00] transition-colors group-hover:text-black">
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-0.5 group-hover:text-black/60">
                    Yield
                    </p>
                    <p className="text-lg font-black italic tracking-tighter leading-none group-hover:text-black">
                    {pair.apr.toFixed(0)}%
                    </p>
                </div>
              </div>
            </button>
          ))}
          
           {/* Load More Trigger */}
           {hasMore && (
              <div ref={loaderRef} className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-[#E2FF00] rounded-full animate-spin" />
              </div>
           )}
        </div>
        )}
      </div>

      <div className="pt-8 flex flex-col items-center gap-4 opacity-30">
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
        <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">
          Pamelo Alpha Catalog
        </p>
      </div>

      {/* Pair Details Bottom Sheet */}
      <PairDetailsBottomSheet
        pairId={selectedPairId}
        isOpen={!!selectedPairId}
        onClose={() => setSelectedPairId(null)}
        onEnterPosition={handleEnterPosition}
      />

      {/* Delegation Bottom Sheet */}
      <DelegationBottomSheet
        pairId={delegationPairId}
        isOpen={showDelegationSheet}
        onClose={handleDelegationClose}
        onBack={handleDelegationBack}
        amount={delegationAmount}
      />
    </div>
  );
}
