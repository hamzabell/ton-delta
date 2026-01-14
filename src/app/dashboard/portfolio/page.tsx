"use client";

import { useState } from "react";
import { ArrowUpRight, ShieldCheck, ChevronDown, ChevronUp, Wallet, ArrowDownLeft, QrCode, Copy, X, ExternalLink } from "lucide-react";
import { useTonWallet, TonConnectButton } from "@tonconnect/ui-react";
import Link from "next/link";
import clsx from "clsx";

export default function PortfolioPage() {
  const wallet = useTonWallet();
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"fund" | "withdraw" | "redeem" | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);

  // Mock Data
  const protocolBalance = 1042.50;
  const walletBalance = 250.00; // Mock TON balance if connected, else 0
  const totalNetWorth = protocolBalance + (wallet ? walletBalance : 0);

  return (
    <div className="space-y-8 pt-4 pb-24 relative">
      <div>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center mb-4">Total Net Worth</p>
           <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl text-center">
              ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
           </h1>
           <div className="flex justify-center mt-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <ArrowUpRight className="w-4 h-4" />
                    +$42.50 (4.2%)
                </div>
           </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
          <button 
             onClick={() => setActiveModal("fund")}
             className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-4 rounded-2xl font-bold flex flex-col items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
              <div className="p-2 bg-slate-950/10 rounded-full">
                  <ArrowDownLeft className="w-6 h-6" />
              </div>
              Fund Wallet
          </button>
          <button 
             onClick={() => setActiveModal("withdraw")}
             className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-2xl font-bold flex flex-col items-center gap-2 transition-all border border-slate-700 active:scale-95"
          >
             <div className="p-2 bg-slate-950/30 rounded-full">
                  <ArrowUpRight className="w-6 h-6" />
              </div>
              Withdraw
          </button>
      </div>

      {/* Balances Breakdown */}
      <div className="grid grid-cols-1 gap-4">
           {/* Active Trades Balance */}
           <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Active Basis Trades</p>
                        <p className="text-lg font-bold text-white">${protocolBalance}</p>
                    </div>
                </div>
           </div>

           {/* Wallet Balance */}
           <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Idle Assets</p>
                        <p className="text-lg font-bold text-white">
                            {wallet ? `$${walletBalance}` : "Not Connected"}
                        </p>
                    </div>
                </div>
                {!wallet && <TonConnectButton />}
           </div>
      </div>

      {/* Active Positions */}
      <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 px-1 uppercase tracking-widest">Live Positions</h2>
          
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800/50 shadow-xl">
              <div className="p-5 sm:p-6 hover:bg-slate-900/40 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Info Section */}
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] shrink-0">T</div>
                          <div>
                              <p className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">TON / USDT</p>
                              <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                 <p className="text-xs text-slate-500 font-medium">Regular Basis • USDT Hedge</p>
                              </div>
                          </div>
                      </div>

                      {/* Right: Value & Actions Section */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
                          <div className="text-left sm:text-right">
                              <p className="font-bold text-white text-xl sm:text-lg tracking-tight">$1,042.50</p>
                              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">+12.4 TON (Yield)</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                              <Link 
                                href="/dashboard/trade/ton-usdt"
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95"
                              >
                                  Manage
                              </Link>
                              <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedPosition({ name: "TON / USDT", balance: 1042.50 });
                                    setActiveModal("redeem");
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border border-slate-700 transition-all active:scale-95"
                              >
                                  Redeem
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Proof of Reserves Terminal */}
      <div className="space-y-4">
          <div 
             onClick={() => setIsTerminalOpen(!isTerminalOpen)}
             className="group cursor-pointer bg-[#0B1221] border border-slate-800 hover:border-emerald-500/30 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
          >
              <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Hedge Health Monitor</p>
                          <p className="text-xs text-slate-500 font-medium">Solvency Verified • Live 24/7</p>
                      </div>
                  </div>
                  {isTerminalOpen ? <ChevronUp className="w-5 h-5 text-slate-500"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}
              </div>
              
              {isTerminalOpen && (
                  <div className="p-6 bg-black/80 font-mono text-xs space-y-3 text-slate-400 border-t border-slate-800/50">
                       <div className="flex gap-4"><span className="text-slate-600 font-bold">[LIVE]</span><span className="text-blue-400 font-bold">NET_DELTA_CHECK</span><span className="animate-pulse text-emerald-500">NEUTRAL (0.001)</span></div>
                        <div className="flex gap-4"><span className="text-slate-600 font-bold">[LIVE]</span><span className="text-purple-400 font-bold">CEX_COLLATERAL</span><span>1,420.50 USDT</span></div>
                       <div className="flex gap-4 border-t border-slate-800/50 pt-3 mt-2">
                          <span className="text-emerald-500 font-bold">SYSTEM STATUS</span>
                          <span className="text-emerald-400 font-black tracking-wider">HEALTHY ✅</span>
                      </div>
                  </div>
              )}
          </div>
      </div>


      {/* Fund / Withdraw Modals */}
      {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-[#0B1221] w-full max-w-sm border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">
                            {activeModal === "fund" ? "Fund Wallet" : activeModal === "withdraw" ? "Withdraw Funds" : "Redeem Position"}
                        </h3>
                        <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                    </div>

                    {activeModal === "fund" ? (
                        <div className="space-y-6 text-center">
                            <div className="bg-white p-4 rounded-xl inline-block">
                                <QrCode className="w-32 h-32 text-black" />
                            </div>
                            <p className="text-sm text-slate-400">Scan to receive TON or USDT</p>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                                <code className="text-xs text-slate-500 truncate max-w-[150px]">UQAn...4xK2</code>
                                <button className="text-emerald-400 text-xs font-bold flex items-center gap-1 hover:text-emerald-300">
                                    <Copy className="w-3 h-3" /> Copy
                                </button>
                            </div>
                            <a href="https://ton.org/buy" target="_blank" className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                <ExternalLink className="w-4 h-4" /> Buy TON
                            </a>
                        </div>
                     ) : activeModal === "withdraw" ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Select Asset</label>
                                <select className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl font-bold focus:outline-none">
                                    <option>TON</option>
                                    <option>USDT</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                                <input type="number" placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl font-bold focus:outline-none focus:border-emerald-500 transition-colors" />
                                <p className="text-right text-[10px] text-slate-500 font-bold">Available: {protocolBalance} USD</p>
                            </div>
                             <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                 Confirm Withdrawal
                             </button>
                         </div>
                     ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase">Redeeming From</p>
                                    <p className="font-bold text-white">{selectedPosition?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Available</p>
                                    <p className="font-bold text-white">${selectedPosition?.balance}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Amount to Redeem</label>
                                <div className="relative">
                                    <input type="number" placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl font-bold focus:outline-none focus:border-red-500 transition-colors" defaultValue={selectedPosition?.balance} />
                                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300">MAX</button>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl space-y-2 border border-slate-800/50">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Unrolling Spot</span>
                                    <span className="text-white font-bold">~142.5 TON</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Closing Hedge</span>
                                    <span className="text-white font-bold">~1,042.5 USDT</span>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 uppercase tracking-wider text-sm">
                                Confirm Redemption
                            </button>
                        </div>
                     )}
               </div>
          </div>
      )}

    </div>
  );
}
