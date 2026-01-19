"use client";

import { useState } from "react";
import { ArrowUpRight, ShieldCheck, Wallet, ArrowDownLeft } from "lucide-react";
import { useTonWallet, TonConnectButton } from "@tonconnect/ui-react";

export default function PortfolioPage() {
  const wallet = useTonWallet();

  // V1 Institutional Mock Data
  const institutionalBalance = 15420.50;
  const walletBalance = 1250.00;
  const totalEquity = institutionalBalance + (wallet ? walletBalance : 0);

  return (
    <div className="space-y-8 pb-24">
      {/* Small Equity Header */}
      <div className="space-y-1">
           <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider">Total Balance</p>
           <h1 className="text-3xl font-bold text-white tracking-tight">
              ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
           </h1>
           <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-wider">+$642.12 (4.3%) • Last 24h</p>
      </div>

      {/* Buttons - Simplified */}
      <div className="grid grid-cols-2 gap-4">
          <button className="bg-[#E2FF00] text-[#020617] p-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all">
              <ArrowDownLeft className="w-4 h-4" />
              Deposit
          </button>
          <button className="bg-white/5 text-white p-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all">
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
          </button>
      </div>

      {/* Balances */}
      <div className="space-y-3">
            <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Managed Assets</h2>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <ShieldCheck className="w-5 h-5 text-[#E2FF00]" />
                    <div>
                        <p className="text-xs font-bold text-white">V1 Vaults</p>
                        <p className="text-[10px] text-white/30 truncate">Institutional Hedge Position</p>
                    </div>
                </div>
                <p className="text-sm font-bold text-white">${institutionalBalance.toLocaleString()}</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Wallet className="w-5 h-5 text-white/40" />
                    <div>
                        <p className="text-xs font-bold text-white">TON Wallet</p>
                        <p className="text-[10px] text-white/30 truncate">Liquid Assets</p>
                    </div>
                </div>
                {wallet ? (
                    <p className="text-sm font-bold text-white/60">${walletBalance.toLocaleString()}</p>
                ) : (
                    <div className="scale-75 origin-right">
                        <TonConnectButton />
                    </div>
                )}
            </div>
      </div>

      {/* Active Positions Table - Cleanized */}
      <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Active Positions</h2>
          
          <div className="space-y-2">
              {[
                { pair: "TON / USDT", icon: "T", value: "$9,420.50", yield: "+$420.50", status: "Neutral" },
                { pair: "TON / BTC", icon: "B", value: "$5,000.00", yield: "+$180.20", status: "Neutral" }
              ].map((pos) => (
                <div key={pos.pair} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white/50 border border-white/10">
                            {pos.icon}
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white">{pos.pair}</p>
                            <p className="text-[10px] text-white/20 font-medium">{pos.status} • swap.coffee</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="font-bold text-sm text-white">{pos.value}</p>
                            <p className="text-[9px] text-[#E2FF00] font-bold uppercase tracking-wider">{pos.yield}</p>
                        </div>
                        <button className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors">
                            Redeem
                        </button>
                    </div>
                </div>
              ))}
          </div>
      </div>
    </div>
  );
}
