"use client";

import { useState } from "react";
import { Zap, Shield, Flame, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STABLE_PAIRS = [
  { id: "usdt-ton", name: "USDT / TON", apr: "24.5%", risk: "Low", category: "Stable", icon: "T" },
];

const MEME_PAIRS = [
  { id: "usdt-dogs", name: "USDT / DOGS", apr: "142.3%", risk: "High", category: "Meme", icon: "D" },
  { id: "usdt-not", name: "USDT / NOT", apr: "115.8%", risk: "High", category: "Meme", icon: "N" },
  { id: "usdt-redo", name: "USDT / REDO", apr: "185.0%", risk: "High", category: "Meme", icon: "R" },
];

export default function OpportunitiesPage() {
  const [filter, setFilter] = useState<"stable" | "meme">("meme");
  const pairs = filter === "stable" ? STABLE_PAIRS : MEME_PAIRS;

  return (
    <div className="space-y-12 pb-24">
      {/* AA Wallet Status Indicator */}
      <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">W5 Account Active</p>
          </div>
          <p className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-widest leading-none">Restricted Session Live</p>
      </div>

      {/* Ultra-Simple Header */}
      <div className="space-y-6">
          <div className="space-y-1">
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Harvest</h1>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Select Yield Spectrum</p>
          </div>
          
          {/* Spectrum Toggle */}
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
              <button 
                onClick={() => setFilter("meme")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                  filter === "meme" ? "bg-[#E2FF00] text-[#020617] shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <Flame className={cn("w-3 h-3", filter === "meme" ? "opacity-100" : "opacity-40")} />
                Meme Alpha
              </button>
              <button 
                onClick={() => setFilter("stable")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                  filter === "stable" ? "bg-white text-[#020617] shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <Shield className={cn("w-3 h-3", filter === "stable" ? "opacity-100" : "opacity-40")} />
                Stable Yield
              </button>
          </div>

          <div className="flex gap-8 border-t border-white/5 pt-6">
              <div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1.5">Network TVL</p>
                  <p className="text-xl font-bold text-white tracking-tight">$14.2M</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1.5">Model</p>
                  <p className="text-xl font-bold text-[#E2FF00] tracking-tight">USDT Base</p>
              </div>
          </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {pairs.map((pair) => (
            <Link 
              key={pair.id}
              href={`/dashboard/trade/${pair.id}`}
              className="group p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.05] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold text-base">
                        {pair.icon}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">
                            {pair.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                pair.risk === "Low" ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                            )}>
                                {pair.risk} Risk
                            </span>
                            <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{pair.category}</span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-1">Target Yield</p>
                    <p className="text-xl font-black text-white italic tracking-tighter leading-none">{pair.apr}</p>
                </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="pt-8 flex flex-col items-center gap-4 opacity-30">
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
          <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Pamelo Alpha Catalog</p>
      </div>
    </div>
  );
}
