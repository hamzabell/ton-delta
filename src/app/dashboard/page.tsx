"use client";

import Link from "next/link";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-12 pb-24">
      {/* Ultra-Simple Header */}
      <div className="space-y-4">
          <div className="space-y-1">
              <h1 className="text-3xl font-bold text-white tracking-tighter">Yield</h1>
              <p className="text-xs text-white/30 font-medium tracking-wide">Automated Neutral Basis • swap.coffee</p>
          </div>
          
          <div className="flex gap-8 border-t border-white/5 pt-4">
              <div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Total TVL</p>
                  <p className="text-lg font-bold text-white tracking-tight">$27.4M</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Avg Yield</p>
                  <p className="text-lg font-bold text-[#E2FF00] tracking-tight">40.3%</p>
              </div>
          </div>
      </div>

      {/* Simplified List */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "ton-usdt", name: "TON / USDT", apr: "42.5%", funding: "+0.04%", icon: "T" },
            { id: "ton-btc", name: "TON / BTC", apr: "38.0%", funding: "+0.03%", icon: "B" },
            { id: "ton-eth", name: "TON / ETH", apr: "39.5%", funding: "+0.03%", icon: "E" }
          ].map((pair) => (
            <Link 
              key={pair.id}
              href={`/dashboard/trade/${pair.id}`}
              className="group flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors -mx-2 px-2"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold text-sm">
                        {pair.icon}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">
                            {pair.name}
                        </h3>
                        <p className="text-[10px] text-white/20 font-medium">Verified Neutral</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-base font-bold text-white tracking-tight">{pair.apr}</p>
                    <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-wider">{pair.funding}</p>
                </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="pt-8 text-center opacity-10">
          <p className="text-[10px] font-medium text-white uppercase tracking-widest">End of Catalog</p>
      </div>
    </div>
  );
}
