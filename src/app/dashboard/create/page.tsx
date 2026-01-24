"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { ArrowLeft, Rocket, ShieldCheck, ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { useTonWallet, TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const PAIRS = [
  { id: "ton-usdt", label: "TON / USDT", base: "TON", quote: "USDT", icon: "https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/image.png" },
  { id: "ton-btc", label: "TON / BTC", base: "TON", quote: "BTC", icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png" },
  { id: "ton-eth", label: "TON / ETH", base: "TON", quote: "ETH", icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png" },
  { id: "not-usdt", label: "NOT / USDT", base: "NOT", quote: "USDT", icon: "https://asset.ston.fi/img/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT/image.png" },
];

export default function CreateCustomTradePage() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
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
  const [fundingRate, setFundingRate] = useState<number>(0);
  const [stasisPreference, setStasisPreference] = useState<"CASH" | "STAKE">("STAKE");

  const selectedPair = PAIRS.find(p => p.id === formData.pair) || PAIRS[0];
  const filteredPairs = PAIRS.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.quote.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Effect to fetch real-time funding rate
  useEffect(() => {
     const fetchRate = async () => {
         try {
             // Only fetch if pair ID is valid
             if (!formData.pair) return;
             
             const res = await fetch(`/api/pairs?id=${formData.pair}`);
             if (res.ok) {
                 const data = await res.json();
                 setFundingRate(data.fundingRate || 0);
             }
         } catch(e) { console.error("Failed to fetch rate", e); }
     };
     fetchRate();
  }, [formData.pair]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !formData.amount[0]) return;
    
    setIsSubmitting(true);
    
    try {
        // 1. Prepare W5 Authorization Logic
        const { buildAddExtensionBody } = await import("@/lib/w5-utils");
        const { Address, toNano } = await import("@ton/core");
        
        const userAddress = Address.parse(wallet.account.address);
        // Keeper Address deals with Delegation
        const keeperAddress = Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS || ""); 
        // Treasury deals with Funds (Mock Vault)
        const treasuryAddress = process.env.PAMELO_TREASURY_WALLET || keeperAddress.toString();

        // 2. Build Payloads
        const authPayload = await buildAddExtensionBody(userAddress, keeperAddress);
        
        // 3. Construct Helper Message Bundle
        // Msg 1: Install Extension (To Self)
        const messages = [
            {
                address: wallet.account.address,
                amount: toNano("0.05").toString(), 
                payload: authPayload.toBoc().toString("base64")
            }
        ];

        // 4. Send Transaction (One User Signature)
        const txResult = await tonConnectUI.sendTransaction({
            messages: messages,
            validUntil: Date.now() + 5 * 60 * 1000 
        });
        
        // 5. Create Backend Position Record
        const res = await fetch('/api/positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pairId: formData.pair,
                capitalTON: formData.amount[0],
                userId: wallet.account.address, 
                txHash: txResult.boc,
                // Negative Funding Override
                initialStatus: fundingRate < 0 
                  ? (stasisPreference === 'STAKE' ? 'stasis_pending_stake' : 'stasis') 
                  : undefined,
                stasisPreference: fundingRate < 0 ? stasisPreference : 'CASH'
            })
        });
        
        if (!res.ok) throw new Error("Failed to create position record");

        const message = fundingRate < 0 
            ? `Vault Deployed in Stasis Mode (${stasisPreference === 'STAKE' ? 'Liquid Stake' : 'Cash'}).`
            : "Custom Trade Deployed Successfully!\nW5 Authorization Sent.";

        alert(message);
        router.push("/dashboard/portfolio");

    } catch (e) {
        console.error(e);
        alert("Deployment Failed: " + (e as Error).message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const selectPair = (pairId: string) => {
    setFormData({...formData, pair: pairId});
    setShowPairSheet(false);
    setSearchQuery("");
  };

  return (
    <div className="pt-2 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors border border-white/10">
           <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Custom Vault</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-2">Engineered by swap.coffee</p>
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
                          <div className="w-10 h-10 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-black text-lg overflow-hidden border border-white/10">
                              {selectedPair.icon.startsWith('http') ? (
                                  <img src={selectedPair.icon} alt={selectedPair.label} className="w-full h-full object-cover" />
                              ) : (
                                  selectedPair.icon
                              )}
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
                  <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Strategy Mode</label>
                      {fundingRate < 0 ? (
                           <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded italic">Negative Funding Protection</span>
                      ) : (
                           <span className="text-[10px] font-black text-[#E2FF00] uppercase tracking-widest bg-[#E2FF00]/10 px-2 py-0.5 rounded italic">V1 Standard</span>
                      )}
                  </div>
                  <div className="grid grid-cols-1">
                      {fundingRate < 0 ? (
                          <div className="space-y-3">
                              <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                                  <div className="text-sm font-black uppercase mb-1 italic flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4" /> Negative Funding Protection
                                  </div>
                                  <div className="text-[10px] leading-tight opacity-80 uppercase tracking-widest font-bold">
                                      Basis trade is disabled. Choose a capital preservation strategy:
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setStasisPreference("STAKE")}
                                    className={clsx(
                                        "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                        stasisPreference === "STAKE"
                                            ? "bg-purple-500/20 border-purple-500 text-white"
                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                  >
                                      <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Yield Hunter</div>
                                      <div className="text-sm font-black italic">Liquid Stake</div>
                                      <div className="text-[10px] opacity-60 mt-0.5">~4% APY</div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStasisPreference("CASH")}
                                    className={clsx(
                                        "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                        stasisPreference === "CASH"
                                            ? "bg-blue-500/20 border-blue-500 text-white"
                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                  >
                                      <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Safe Harbor</div>
                                      <div className="text-sm font-black italic">Hold Cash</div>
                                      <div className="text-[10px] opacity-60 mt-0.5">0% Risk</div>
                                  </button>
                              </div>
                          </div>
                      ) : (
                          <div className="p-5 rounded-2xl border border-[#E2FF00]/20 bg-[#E2FF00]/5 text-[#E2FF00] shadow-[0_0_20px_rgba(226,255,0,0.05)]">
                              <div className="text-sm font-black uppercase mb-1 italic">Regular Basis</div>
                              <div className="text-[10px] leading-tight opacity-60 uppercase tracking-widest font-black">Long Spot + Short Perp (Fully Hedged)</div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Investment Amount</label>
                   <div className="text-center bg-white/[0.03] rounded-[2rem] p-8 border border-white/5 group-hover:border-[#E2FF00]/30 transition-all">
                       <div className="flex items-center justify-center gap-2">
                          <span className="text-4xl text-white/20 font-black italic">$</span>
                          <input 
                            type="number" 
                            value={formData.amount[0]}
                            onChange={(e) => setFormData({...formData, amount: [parseFloat(e.target.value) || 0]})}
                            className="bg-transparent text-5xl font-black text-white text-center w-full focus:outline-none placeholder-white/5 italic tracking-tighter"
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
              <div className="pt-2">
                  {!wallet ? (
                       <div className="flex justify-center">
                           <TonConnectButton />
                       </div>
                  ) : (
                       <button 
                           type="submit"
                           disabled={isSubmitting || formData.amount[0] === 0}
                           className={clsx(
                               "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2",
                               isSubmitting || formData.amount[0] === 0
                                   ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                   : "bg-[#E2FF00] text-[#020617] hover:scale-105 shadow-[0_20px_40px_rgba(226,255,0,0.15)]"
                           )}
                       >
                           {isSubmitting ? "Deploying Vault..." : (
                               <>
                                   <Rocket className="w-4 h-4" /> Deploy Delta Vault
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
                                  "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl overflow-hidden border border-white/10",
                                  formData.pair === pair.id
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-slate-800 text-slate-400"
                              )}>
                                  {pair.icon.startsWith('http') ? (
                                      <img src={pair.icon} alt={pair.label} className="w-full h-full object-cover" />
                                  ) : (
                                      pair.icon
                                  )}
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
