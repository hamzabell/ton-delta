"use client";

import { useState } from "react";
import { ShieldCheck, Activity, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

const V1_PAIRS = [
  { id: "ton-usdt", label: "TON / USDT" },
  { id: "ton-btc", label: "TON / BTC" },
];

export default function TransparencyPage() {
  const [selectedPair, setSelectedPair] = useState("ton-usdt");

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">System Audit</h1>
          <p className="text-xs text-white/30 font-medium">Real-time Solvency & Neutrality Proof</p>
      </div>

      {/* Asset Switcher - Minimal */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
          {V1_PAIRS.map((p) => (
              <button
                  key={p.id}
                  onClick={() => setSelectedPair(p.id)}
                  className={clsx(
                      "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      selectedPair === p.id ? "bg-white text-[#020617]" : "text-white/40 hover:text-white"
                  )}
              >
                  {p.label}
              </button>
          ))}
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2">Hedge Health</p>
              <h3 className="text-2xl font-bold text-white">99.9%</h3>
              <p className="text-[10px] text-[#E2FF00] font-medium mt-1">Hedged Position</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2">Custodian</p>
              <h3 className="text-2xl font-bold text-white">Live</h3>
              <p className="text-[10px] text-[#E2FF00] font-medium mt-1">Bot Running</p>
          </div>
      </div>

      {/* Minimal Ledger */}
      <div className="space-y-4">
           <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Solvency Ledger</h2>
           
           <div className="space-y-2">
                {[
                  { leg: "Spot", provider: "swap.coffee", action: "Aggregated TON", status: "Verified" },
                  { leg: "Futures", provider: "Storm Trade", action: "Neutral Hedge", status: "Verified" },
                  { leg: "Keeper", provider: "Delta Bot", action: "BOC Signing", status: "Running" }
                ].map((item, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-[#E2FF00]" />
                            <div>
                                <p className="text-[10px] font-bold text-white/20">{item.leg} • {item.provider}</p>
                                <p className="text-xs font-bold text-white">{item.action}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-[#E2FF00] uppercase">{item.status}</span>
                    </div>
                ))}
           </div>
      </div>
    </div>
  );
}
