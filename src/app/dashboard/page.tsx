"use client";

import { useState } from "react";
import { Trophy, Filter, TrendingUp, Coins, X, Check, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import clsx from "clsx";

// Updated to TON-only ecosystem with Categories
const MARKET_OPPORTUNITIES = [
  {
    pairId: "ton-usdt",
    base: "TON",
    quote: "USDT",
    name: "TON / USDT",
    fundingRate: "+0.0425%",
    annualizedYield: "42.5%",
    tvl: "$12.4M",
    direction: "Regular",
    sentiment: "Strong",
    borderHover: "hover:border-blue-500/50",
    glow: "shadow-blue-500/10",
    text: "text-blue-400",
    iconColor: "text-blue-500",
    badgeBg: "bg-blue-500"
  },
  {
    pairId: "ton-btc",
    base: "TON",
    quote: "BTC",
    name: "TON / BTC",
    fundingRate: "+0.0380%",
    annualizedYield: "38.0%",
    tvl: "$8.2M",
    direction: "Regular",
    sentiment: "Moderate",
    borderHover: "hover:border-orange-500/50",
    glow: "shadow-orange-500/10",
    text: "text-orange-400",
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-500"
  },
  {
    pairId: "ton-eth",
    base: "TON",
    quote: "ETH",
    name: "TON / ETH",
    fundingRate: "+0.0395%",
    annualizedYield: "39.5%",
    tvl: "$6.8M",
    direction: "Regular",
    sentiment: "Stable",
    borderHover: "hover:border-emerald-500/50",
    glow: "shadow-emerald-500/10",
    text: "text-emerald-400",
    iconColor: "text-emerald-500",
    badgeBg: "bg-emerald-500"
  },
  {
    pairId: "not-usdt",
    base: "NOT",
    quote: "USDT",
    name: "NOT / USDT",
    fundingRate: "+0.1428%",
    annualizedYield: "142.8%",
    tvl: "$4.1M",
    direction: "Regular",
    sentiment: "Extreme",
    borderHover: "hover:border-white/50",
    glow: "shadow-white/10",
    text: "text-slate-200",
    iconColor: "text-white",
    badgeBg: "bg-slate-200"
  }
];

export default function OpportunitiesPage() {
  const [selectedAsset, setSelectedAsset] = useState("All");

  const filteredData = MARKET_OPPORTUNITIES.filter(item => {
      const matchAsset = selectedAsset === "All" || item.base === selectedAsset;
      return matchAsset;
  });

  const uniqueAssets = Array.from(new Set(MARKET_OPPORTUNITIES.map(s => s.base)));

  return (
    <div className="space-y-6 pt-2 pb-24 relative min-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div className="space-y-1">
              <h1 className="text-2xl font-black text-white">Live Opportunities</h1>
              <p className="text-sm text-slate-400">Current funding rates across TON ecosystem pairs</p>
          </div>
          <Link 
              href="/dashboard/create"
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95"
          >
              <Plus className="w-4 h-4" />
              Custom
          </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Regular Basis</p>
              <p className="text-2xl font-black text-white">{MARKET_OPPORTUNITIES.filter(o => o.direction === "Regular").length}</p>
              <p className="text-[10px] text-slate-500 mt-1">Positive Funding</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Reverse Basis</p>
              <p className="text-2xl font-black text-white">{MARKET_OPPORTUNITIES.filter(o => o.direction === "Reverse").length}</p>
              <p className="text-[10px] text-slate-500 mt-1">Negative Funding</p>
          </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Available Pairs</h2>
          
          {filteredData.map((item) => (
              <Link href={`/dashboard/trade/${item.pairId}`} key={item.pairId} className="block group">
                  <div className={cn(
                      "relative bg-[#0B1221] border border-slate-800 rounded-3xl p-6 transition-all duration-300",
                      item.borderHover,
                      "hover:bg-[#0F1829] hover:shadow-2xl hover:-translate-y-1",
                      item.glow
                  )}>
                      {/* Direction Badge */}
                      <div className="flex justify-between items-start mb-4">
                          <div className={cn(
                              "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-2",
                              item.direction === "Regular" 
                                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                  : "bg-red-500/10 border border-red-500/30 text-red-400"
                          )}>
                              {item.direction} Basis
                          </div>
                          <div className="text-right">
                              <div className={cn("text-2xl font-black tracking-tight", item.text)}>
                                  {item.fundingRate}
                              </div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold">8hr Rate</div>
                          </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                          <div className={cn("text-4xl font-black opacity-90", item.iconColor)}>
                              {item.base[0]}
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-white leading-none mb-1">{item.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-slate-500">{item.base} / {item.quote}</span>
                                  <span className="text-[10px] text-slate-600">•</span>
                                  <span className="text-xs font-medium text-slate-400">{item.sentiment}</span>
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-2 items-center pt-4 border-t border-slate-800/50">
                          <div className="flex-1 space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Annualized</p>
                              <p className={cn("text-lg font-black", item.text)}>{item.annualizedYield}</p>
                          </div>
                          <div className="flex-1 space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Available TVL</p>
                              <p className="text-lg font-bold text-white">{item.tvl}</p>
                          </div>
                          
                          <button 
                            className="bg-white text-slate-950 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
                          >
                              Trade
                          </button>
                      </div>
                  </div>
              </Link>
          ))}
          
          {filteredData.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                  No opportunities found.
              </div>
          )}
      </div>

    </div>
  );
}
