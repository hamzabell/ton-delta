"use client";

import { useState } from "react";
import { ArrowLeft, Rocket, ShieldCheck, ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { useTonWallet, TonConnectButton } from "@tonconnect/ui-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const PAIRS = [
  { id: "ton-usdt", label: "TON / USDT", base: "TON", quote: "USDT", icon: "T" },
  { id: "ton-btc", label: "TON / BTC", base: "TON", quote: "BTC", icon: "T" },
  { id: "ton-eth", label: "TON / ETH", base: "TON", quote: "ETH", icon: "T" },
  { id: "not-usdt", label: "NOT / USDT", base: "NOT", quote: "USDT", icon: "N" },
];

export default function CreateCustomTradePage() {
  const wallet = useTonWallet();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    pair: "ton-usdt",
    direction: "regular" as "regular" | "reverse",
    amount: [0],
    aprStability: [50],
    stopLoss: [5],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPairSheet, setShowPairSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedPair = PAIRS.find(p => p.id === formData.pair) || PAIRS[0];
  const filteredPairs = PAIRS.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.quote.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate deployment
    setTimeout(() => {
        setIsSubmitting(false);
        alert(`Custom Trade Deployed!\nPair: ${formData.pair.toUpperCase()}\nDirection: ${formData.direction}\nAmount: $${formData.amount[0]}`);
        router.push("/dashboard/portfolio");
    }, 1500);
  };

  const selectPair = (pairId: string) => {
    setFormData({...formData, pair: pairId});
    setShowPairSheet(false);
    setSearchQuery("");
  };

  return (
    <div className="pt-2 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors">
           <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
            <h1 className="text-2xl font-bold text-white">Create Custom Trade</h1>
            <p className="text-sm text-slate-400">Configure your own basis trading opportunity</p>
        </div>
      </div>

      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Asset Pair Dropdown */}
              <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Asset Pair</label>
                  <button
                    type="button"
                    onClick={() => setShowPairSheet(true)}
                    className="w-full flex items-center justify-between p-5 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all"
                  >
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-lg">
                              {selectedPair.icon}
                          </div>
                          <div className="text-left">
                              <p className="font-bold text-white">{selectedPair.label}</p>
                              <p className="text-xs text-slate-500">{selectedPair.base} / {selectedPair.quote}</p>
                          </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                  </button>
              </div>

              {/* Direction Selection */}
              <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Basis Direction</label>
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          type="button"
                          onClick={() => setFormData({...formData, direction: "regular"})}
                          className={clsx(
                              "p-4 rounded-xl border text-left transition-all",
                              formData.direction === "regular" 
                                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}
                      >
                          <div className="text-sm font-black uppercase mb-1">Regular Basis</div>
                          <div className="text-[10px] leading-tight opacity-80">Long Spot + Short Perp</div>
                      </button>
                      <button 
                          type="button"
                          onClick={() => setFormData({...formData, direction: "reverse"})}
                          className={clsx(
                              "p-4 rounded-xl border text-left transition-all",
                              formData.direction === "reverse" 
                                  ? "bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}
                      >
                          <div className="text-sm font-black uppercase mb-1">Reverse Basis</div>
                          <div className="text-[10px] leading-tight opacity-80">Short Spot + Long Perp</div>
                      </button>
                  </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Investment Amount</label>
                  <div className="text-center bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                      <div className="flex items-center justify-center gap-1">
                         <span className="text-2xl text-slate-600 font-light">$</span>
                         <input 
                           type="number" 
                           value={formData.amount[0]}
                           onChange={(e) => setFormData({...formData, amount: [parseFloat(e.target.value) || 0]})}
                           className="bg-transparent text-4xl font-bold text-white text-center w-40 focus:outline-none placeholder-slate-700"
                           placeholder="0"
                         />
                      </div>
                  </div>
                  <Slider 
                      value={formData.amount} 
                      onValueChange={(val) => setFormData({...formData, amount: val})} 
                      max={10000} 
                      step={100} 
                      className="py-4"
                  />
              </div>

              {/* APR Stability */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                   <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <ShieldCheck className="w-3 h-3 text-emerald-500" /> APR Stability
                       </label>
                       <span className={clsx(
                           "text-xs font-black uppercase",
                           formData.aprStability[0] < 30 ? "text-emerald-400" : formData.aprStability[0] > 70 ? "text-amber-400" : "text-blue-400"
                       )}>
                           {formData.aprStability[0] < 30 ? "Conservative" : formData.aprStability[0] > 70 ? "Aggressive" : "Balanced"}
                       </span>
                   </div>
                   <Slider 
                       value={formData.aprStability} 
                       onValueChange={(val) => setFormData({...formData, aprStability: val})} 
                       max={100} 
                       step={10} 
                       className="py-2"
                   />
                   <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                       <span>Stable Yield</span>
                       <span>Max APR</span>
                   </div>
              </div>

              {/* Stop Loss Configuration */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                   <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           Stop Loss (%)
                       </label>
                       <span className="text-xs font-black uppercase text-red-400">
                           {formData.stopLoss[0]}%
                       </span>
                   </div>
                   <Slider 
                       value={formData.stopLoss} 
                       onValueChange={(val) => setFormData({...formData, stopLoss: val})} 
                       max={20} 
                       min={1}
                       step={1} 
                       className="py-2"
                   />
                   <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                       <span>Tight</span>
                       <span>Loose</span>
                   </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                  {!wallet ? (
                       <div className="flex justify-center">
                           <TonConnectButton />
                       </div>
                  ) : (
                       <button 
                           type="submit"
                           disabled={isSubmitting || formData.amount[0] === 0}
                           className={clsx(
                               "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                               isSubmitting || formData.amount[0] === 0
                                   ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                   : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                           )}
                       >
                           {isSubmitting ? "Deploying..." : (
                               <>
                                   <Rocket className="w-5 h-5" /> Deploy Custom Trade
                               </>
                           )}
                       </button>
                  )}
              </div>

          </form>
      </div>

      {/* Bottom Sheet for Pair Selection */}
      {showPairSheet && (
          <>
              {/* Backdrop */}
              <div 
                  className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in duration-200"
                  onClick={() => setShowPairSheet(false)}
              />
              
              {/* Bottom Sheet */}
              <div className="fixed inset-x-0 bottom-0 z-[101] bg-[#0B1221] border-t border-slate-800 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Select Asset Pair</h3>
                      <button
                          onClick={() => setShowPairSheet(false)}
                          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                      >
                          <X className="w-5 h-5 text-slate-400" />
                      </button>
                  </div>

                  {/* Search */}
                  <div className="p-4 border-b border-slate-800">
                      <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                              type="text"
                              placeholder="Search pairs..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                          />
                      </div>
                  </div>

                  {/* Pairs List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {filteredPairs.map((pair) => (
                          <button
                              key={pair.id}
                              onClick={() => selectPair(pair.id)}
                              className={clsx(
                                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                                  formData.pair === pair.id
                                      ? "bg-blue-500/10 border-2 border-blue-500"
                                      : "bg-slate-900/50 border-2 border-transparent hover:bg-slate-800"
                              )}
                          >
                              <div className={clsx(
                                  "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl",
                                  formData.pair === pair.id
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-slate-800 text-slate-400"
                              )}>
                                  {pair.icon}
                              </div>
                              <div className="flex-1 text-left">
                                  <p className="font-bold text-white">{pair.label}</p>
                                  <p className="text-xs text-slate-500">{pair.base} / {pair.quote}</p>
                              </div>
                              {formData.pair === pair.id && (
                                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                  </div>
                              )}
                          </button>
                      ))}
                      {filteredPairs.length === 0 && (
                          <div className="text-center py-12">
                              <p className="text-slate-500">No pairs found</p>
                          </div>
                      )}
                  </div>
              </div>
          </>
      )}
    </div>
  );
}
