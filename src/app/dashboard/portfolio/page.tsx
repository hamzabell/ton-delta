"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ShieldCheck, Wallet, ArrowDownLeft, X, Check, Lock, Cpu, Clock } from "lucide-react";
import { useTonWallet, TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import clsx from "clsx";
import { Settings, LogOut, ChevronRight } from "lucide-react";

export default function PortfolioPage() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // Account Settings State
  const [dailyLimit, setDailyLimit] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);
  const [isChangingLimit, setIsChangingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState("1000");

  const formatCompactNumber = (number: number) => {
    return Intl.NumberFormat('en-US', {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(number);
  };
  // Positions State (Mock data)

  // Positions State (Mock data)
  const [positions, setPositions] = useState([
    { id: 1, pair: "USDT / TON", icon: "T", value: 9420.50, grossProfit: 420.50, status: "Stable", risk: "Low" },
    { id: 2, pair: "USDT / DOGS", icon: "D", value: 5000.00, grossProfit: 1280.20, status: "Meme", risk: "High" }
  ]);

  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Profit Sharing Calculations (20% Cut)
  const totalGrossProfit = positions.reduce((acc, pos) => acc + pos.grossProfit, 0);
  const performanceFee = totalGrossProfit * 0.20;
  
  const institutionalEquity = positions.reduce((acc, pos) => acc + pos.value, 0);
  const netEquity = institutionalEquity - performanceFee;
  
  const walletBalance = 1250.00;
  const totalNetBalance = netEquity + (wallet ? walletBalance : 0);

  const handleRedeem = (id: number) => {
    setRedeemingId(id);
  };

  const confirmRedeem = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPositions(prev => prev.filter(pos => pos.id !== redeemingId));
      setIsProcessing(false);
      setRedeemingId(null);
    }, 2000);
  };

  // const deployAAWallet = () => {
  //   setIsDeploying(true);
  //   setTimeout(() => {
  //       setIsAAContractDeployed(true);
  //       setIsDeploying(false);
  //   }, 2000);
  // };

  const handleDisconnect = async () => {
    await tonConnectUI.disconnect();
  };

  const handleUpdateLimit = () => {
    setIsChangingLimit(true);
    setTimeout(() => {
        setDailyLimit(Number(tempLimit));
        setIsChangingLimit(false);
        setShowSettings(false);
    }, 1500);
  };
  return (
    <div className="space-y-8 pb-24">
      
      {/* 1. Header: Total Net Balance */}
      <div className="space-y-1">
           <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Net Managed Assets</p>
           <h1 className="text-4xl font-black text-white italic tracking-tighter">
              ${totalNetBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
           </h1>
           <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] text-[#E2FF00] font-black uppercase tracking-widest italic">
                   +${totalGrossProfit.toLocaleString()} Yield Harvested
               </span>
               <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">•</span>
               <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                   20% Settle Logic
               </span>
           </div>
      </div>

      {/* 2. Unified Onboarding / Deployment Flow */}
      {!wallet ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white/10" />
              </div>
              <div className="space-y-2">
                  <h2 className="text-sm font-black text-white uppercase italic tracking-tighter">Connection Required</h2>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold max-w-[200px] mx-auto">Access your secure W5 Pamelo Account infrastructure</p>
              </div>
              <div className="scale-110 origin-center">
                <TonConnectButton />
              </div>
          </div>
      ) : (
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-8 group transition-all hover:bg-white/[0.04]">
              {/* Identity & Budget Section */}
              <div className="flex items-start sm:items-center gap-5 flex-1">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#E2FF00]/10 flex items-center justify-center border border-[#E2FF00]/20 text-[#E2FF00] shadow-[0_0_20px_rgba(226,255,0,0.05)]">
                      <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-4">
                      {/* Secure Info */}
                      <div className="space-y-1">
                          <div className="flex items-center gap-2">
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Secure Account</p>
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          </div>
                          <h3 className="text-base font-black text-white font-mono uppercase tracking-tighter italic leading-none">EQ...3F8A</h3>
                      </div>

                      {/* Vertical Budget Section */}
                      <div className="space-y-1.5">
                          <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Daily Budget</p>
                          <button 
                            onClick={() => { setTempLimit(dailyLimit.toString()); setShowSettings(true); }}
                            className="flex items-center gap-2.5 group/btn hover:text-[#E2FF00] transition-colors"
                          >
                              <span className="text-xl font-black text-[#E2FF00] italic uppercase tracking-tighter leading-none">${formatCompactNumber(dailyLimit)} <span className="text-[10px] opacity-40 not-italic ml-0.5 font-bold uppercase tracking-widest">USDT</span></span>
                              <Settings className="w-4 h-4 text-white/20 group-hover/btn:text-[#E2FF00] transition-all group-hover/btn:rotate-90" />
                          </button>
                      </div>
                  </div>
              </div>

              {/* Action Section */}
              <div className="flex items-center sm:justify-end gap-6 pt-6 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/5 sm:pl-8">
                  <button 
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 px-6 py-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/5 sm:bg-transparent border border-white/5 sm:border-none text-white/30 hover:text-red-400 hover:bg-red-400/5 transition-all active:scale-95 group/logout"
                    title="Sign Out"
                  >
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sign Out</span>
                      <LogOut className="w-5 h-5 group-hover/logout:translate-x-0.5 transition-transform" />
                  </button>
              </div>
          </div>
      )}

      {/* 4. Active Positions */}
      <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">Strategy Positions</h2>
          
          <div className="space-y-3">
              {positions.length > 0 ? (
                positions.map((pos) => (
                  <div key={pos.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/[0.05] transition-all relative overflow-hidden">
                      {/* Active Status Glow */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#E2FF00]/40" />
                      
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white/40 border border-white/10 group-hover:border-[#E2FF00]/20 transition-all text-lg italic">
                              {pos.icon}
                          </div>
                          <div>
                              <p className="font-black text-base text-white italic tracking-tighter uppercase">{pos.pair}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex items-center gap-1 text-[#E2FF00] bg-[#E2FF00]/5 px-1.5 py-0.5 rounded border border-[#E2FF00]/10">
                                      <div className="w-1 h-1 rounded-full bg-[#E2FF00] animate-pulse" />
                                      <span className="text-[7px] font-black uppercase tracking-widest leading-none">W5 Active</span>
                                  </div>
                                  <span className={clsx(
                                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                      pos.risk === "Low" ? "text-emerald-500 bg-emerald-500/5" : "text-amber-500 bg-amber-500/5"
                                  )}>{pos.risk} Risk</span>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-6">
                          <div className="text-right">
                              <p className="font-black text-base text-white italic tracking-tighter">${pos.value.toLocaleString()}</p>
                              <p className="text-[9px] text-[#E2FF00] font-black uppercase tracking-wider">+${pos.grossProfit.toLocaleString()} Yield</p>
                          </div>
                      </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl">
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] italic leading-relaxed">No active delegations.<br/>Select a USDT pair to harvest yield.</p>
                </div>
              )}
          </div>
      </div>

      {/* 3. Balances Summary */}
      <div className="space-y-3">
            <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">Capital Ledger</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Pamelo Equity</p>
                    <p className="text-lg font-black text-white font-mono italic leading-none">${netEquity.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Liquid Wallet</p>
                    <p className="text-lg font-black text-white/20 font-mono italic leading-none">${walletBalance.toLocaleString()}</p>
                </div>
            </div>
      </div>

      {/* Account Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center px-6 pb-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Account Limits</h3>
                          <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-widest">W5 Security Guardrails</p>
                      </div>
                      <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-white/40" /></button>
                  </div>

                  <div className="space-y-6 mb-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Daily Withdrawal Limit (USDT)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={tempLimit}
                                onChange={(e) => setTempLimit(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-white font-black italic focus:outline-none focus:border-[#E2FF00]/50 transition-all font-mono"
                                placeholder="Enter limit..."
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#E2FF00] uppercase italic">
                                USDT / DAY
                            </div>
                        </div>
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest px-1 leading-relaxed">
                            This limit is enforced at the W5 contract level. Any attempt to move more than this amount within 24h will be automatically rejected.
                        </p>
                      </div>

                      <div className="p-4 bg-[#E2FF00]/5 border border-[#E2FF00]/10 rounded-2xl flex gap-3">
                          <Check className="w-4 h-4 text-[#E2FF00] shrink-0 mt-0.5" />
                          <p className="text-[9px] text-[#E2FF00]/60 font-bold uppercase tracking-wider leading-relaxed">
                              Decreasing limits is instant. Increasing limits requires a 24-hour security delay on-chain.
                          </p>
                      </div>
                  </div>

                  <button 
                    onClick={handleUpdateLimit}
                    disabled={isChangingLimit}
                    className="w-full bg-[#E2FF00] text-[#020617] py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                      {isChangingLimit ? (
                          <div className="w-4 h-4 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" />
                      ) : (
                          <>Propose Limit Update <ChevronRight className="w-4 h-4" /></>
                      )}
                  </button>
              </div>
          </div>
      )}
      {redeemingId && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center px-6 pb-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Withdraw & Settle</h3>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Atomic Profit Sharing</p>
                      </div>
                      <button onClick={() => setRedeemingId(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-white/40" /></button>
                  </div>

                  <div className="p-5 bg-white/5 rounded-2xl space-y-4 mb-8">
                     <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Gross Profit</span>
                         <span className="text-sm font-bold text-white font-mono">${positions.find(p => p.id === redeemingId)?.grossProfit.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Protocol Fee (20%)</span>
                         <span className="text-sm font-bold text-[#E2FF00] italic font-mono">-${((positions.find(p => p.id === redeemingId)?.grossProfit || 0) * 0.2).toLocaleString()}</span>
                     </div>
                     <div className="h-px bg-white/5" />
                     <div className="flex justify-between items-center text-emerald-400">
                         <span className="text-[10px] font-bold uppercase tracking-widest">Net Redemption Value</span>
                         <span className="text-lg font-black font-mono">${((positions.find(p => p.id === redeemingId)?.value || 0) - (positions.find(p => p.id === redeemingId)?.grossProfit || 0) * 0.2).toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="space-y-3">
                      <button 
                        onClick={confirmRedeem}
                        disabled={isProcessing}
                        className={clsx(
                            "w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                            isProcessing ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white text-[#020617] hover:bg-white/90"
                        )}
                      >
                          {isProcessing ? (
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                              <>Atomic Settle & Close</>
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
