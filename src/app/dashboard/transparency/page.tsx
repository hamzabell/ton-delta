"use client";

import { useState } from "react";
import { ShieldCheck, Activity, CheckCircle2, Lock, Cpu, Search, ChevronDown, X } from "lucide-react";
import clsx from "clsx";

const V1_PAIRS = [
  { id: "usdt-ton", label: "USDT / TON", type: "stable" },
  { id: "usdt-dogs", label: "USDT / DOGS", type: "meme" },
  { id: "usdt-not", label: "USDT / NOT", type: "meme" },
  { id: "usdt-redo", label: "USDT / REDO", type: "meme" },
];

export default function TransparencyPage() {
  const [selectedPairId, setSelectedPairId] = useState("usdt-ton");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedPair = V1_PAIRS.find(p => p.id === selectedPairId) || V1_PAIRS[0];

  const filteredPairs = V1_PAIRS.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLedger = (type: string) => [
    { leg: "Vault", provider: "TON W5", action: "Non-Custodial AA", status: "Secure" },
    { leg: "Spot", provider: "swap.coffee", action: type === "stable" ? "Delta-Neutral Spot" : "Aggregated Liquidity", status: "Optimal" },
    { leg: "Perp", provider: "Storm Trade", action: type === "stable" ? "Symmetric Hedge" : "Meme Alpha Logic", status: type === "stable" ? "Balanced" : "Active" },
    { leg: "Settlement", provider: "Distributor", action: "Atomic 80/20 Profit Split", status: "Verified" }
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-1">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Trust Architecture</h1>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Real-Time TON Solvency Audit</p>
      </div>

      {/* Asset Switcher - Dropdown Trigger */}
      <button 
        onClick={() => setIsSheetOpen(true)}
        className="w-full flex items-center justify-between bg-white/[0.03] p-5 rounded-3xl border border-white/5 hover:bg-white/[0.06] hover:border-[#E2FF00]/20 transition-all group"
      >
          <div className="flex flex-col items-start gap-1">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Active Audit Scope</span>
              <span className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedPair.label}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#E2FF00] group-hover:text-[#020617] group-hover:scale-110 transition-all duration-300">
              <ChevronDown className="w-5 h-5" />
          </div>
      </button>

      {/* Health Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl sm:rounded-[2rem] p-4 sm:p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Activity className="w-8 h-8 sm:w-12 sm:h-12" />
              </div>
              <p className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 sm:mb-2 text-nowrap">Strategy Health</p>
              <h3 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter">100.0%</h3>
              <p className="text-[8px] sm:text-[9px] text-[#E2FF00] font-black uppercase tracking-widest mt-1 sm:mt-2 italic">
                  {selectedPair.type === "stable" ? "Delta Verified" : "Meme Alpha Verified"}
              </p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl sm:rounded-[2rem] p-4 sm:p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck className="w-8 h-8 sm:w-12 sm:h-12" />
              </div>
              <p className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 sm:mb-2 text-nowrap">AA Verification</p>
              <h3 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter">Secure</h3>
              <p className="text-[8px] sm:text-[9px] text-[#E2FF00] font-black uppercase tracking-widest mt-1 sm:mt-2 italic">Pamelo W5 Account</p>
          </div>
      </div>

      {/* Verification Ledger */}
      <div className="space-y-4">
           <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 flex items-center justify-between">
               <span>Verification Ledger</span>
               <span className="text-[#E2FF00]">{selectedPair.label}</span>
           </h2>
           
           <div className="space-y-3">
                {getLedger(selectedPair.type).map((item, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 group hover:bg-white/[0.05] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em] mb-0.5">{item.leg} • {item.provider}</p>
                                <p className="text-sm font-black text-white uppercase italic tracking-tight">{item.action}</p>
                            </div>
                        </div>
                        <div className="flex sm:justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                           <span className="text-[10px] font-black text-[#E2FF00] uppercase tracking-widest italic">{item.status}</span>
                        </div>
                    </div>
                ))}
           </div>
      </div>

      {/* Bottom Sheet UI */}
      {isSheetOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4 animate-in fade-in duration-300">
              <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-md" 
                onClick={() => setIsSheetOpen(false)} 
              />
              <div className="relative w-full max-w-sm bg-[#070B14] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[75vh] animate-in slide-in-from-bottom-full duration-500 overflow-hidden">
                  {/* Decorative Handle */}
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-4 shrink-0" />
                  
                  <div className="px-8 pt-8 pb-10 space-y-8 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between shrink-0">
                          <div className="space-y-1">
                              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Audit Scope</h3>
                              <p className="text-[10px] text-[#E2FF00] font-black uppercase tracking-widest">Select Pair To Verify</p>
                          </div>
                          <button 
                            onClick={() => setIsSheetOpen(false)}
                            className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90"
                          >
                              <X className="w-5 h-5 text-white/60" />
                          </button>
                      </div>

                      {/* Search Bar - Custom Aesthetic */}
                      <div className="relative shrink-0">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input 
                            type="text"
                            placeholder="SEARCH TON PAIRS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-[10px] font-black text-white uppercase tracking-[0.2em] focus:outline-none focus:border-[#E2FF00]/40 transition-all placeholder:text-white/10"
                            autoFocus
                          />
                      </div>

                      {/* Pairs List - Scrollable */}
                      <div className="space-y-3 overflow-y-auto no-scrollbar pb-2">
                          {filteredPairs.map((p) => (
                              <button
                                  key={p.id}
                                  onClick={() => {
                                      setSelectedPairId(p.id);
                                      setIsSheetOpen(false);
                                      setSearchQuery("");
                                  }}
                                  className={clsx(
                                      "w-full flex items-center justify-between p-6 rounded-3xl transition-all duration-300 group relative overflow-hidden",
                                      selectedPairId === p.id 
                                        ? "bg-[#E2FF00] text-[#020617]" 
                                        : "bg-white/[0.03] border border-white/5 hover:border-white/20 text-white"
                                  )}
                              >
                                  <div className="flex flex-col items-start gap-0.5">
                                      <span className={clsx(
                                          "text-[8px] font-black uppercase tracking-[0.3em]",
                                          selectedPairId === p.id ? "opacity-50" : "text-white/20"
                                      )}>{p.type} Yield</span>
                                      <span className="text-lg font-black uppercase italic tracking-tighter leading-none">{p.label}</span>
                                  </div>
                                  
                                  {selectedPairId === p.id ? (
                                      <CheckCircle2 className="w-6 h-6" />
                                  ) : (
                                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#E2FF00]/10 transition-all">
                                          <ShieldCheck className="w-4 h-4 text-white/20 group-hover:text-[#E2FF00]" />
                                      </div>
                                  )}
                              </button>
                          ))}
                          
                          {filteredPairs.length === 0 && (
                              <div className="py-20 text-center space-y-4">
                                  <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center border border-white/5">
                                      <Lock className="w-5 h-5 text-white/10" />
                                  </div>
                                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">No Valid Audit Scope</p>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Aesthetic Glow Bottom */}
                  <div className="h-2 bg-gradient-to-t from-[#E2FF00]/10 to-transparent shrink-0" />
              </div>
          </div>
      )}
    </div>
  );
}
