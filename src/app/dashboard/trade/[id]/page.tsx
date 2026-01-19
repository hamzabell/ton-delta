"use client";

import { useState } from "react";
import { ArrowLeft, TrendingUp, ShieldCheck, Activity, Info, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTonWallet } from "@tonconnect/ui-react";
import clsx from "clsx";

const PAIR_DATA: Record<string, any> = {
  "ton-usdt": { base: "TON", quote: "USDT", yield: "42.5%", funding: "+0.04%" },
  "ton-btc": { base: "TON", quote: "BTC", yield: "38.0%", funding: "+0.03%" },
  "ton-eth": { base: "TON", quote: "ETH", yield: "39.5%", funding: "+0.03%" },
};

export default function TradePage() {
  const params = useParams();
  const pairId = (params.id as string) || "ton-usdt";
  const data = PAIR_DATA[pairId] || PAIR_DATA["ton-usdt"];

  const [amount, setAmount] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleExecute = () => {
    if (!amount) return;
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setAmount("");
      alert("Position Deployed Successfully");
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors border border-white/5">
           <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
            <h1 className="text-xl font-bold text-white tracking-tight">{data.base} / {data.quote}</h1>
            <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-wider">V1 Neutral Basis</p>
        </div>
      </div>

      {/* Yield Summary Card */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex justify-between items-center">
          <div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Target APR</p>
              <p className="text-3xl font-bold text-white italic tracking-tighter">{data.yield}</p>
          </div>
          <div className="text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">8hr Funding</p>
              <p className="text-lg font-bold text-[#E2FF00]">{data.funding}</p>
          </div>
      </div>

      {/* Main Input Section */}
      <div className="space-y-6">
          <div className="text-center space-y-4 py-8">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Amount to Invest (USD)</p>
              <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-light text-white/20">$</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-5xl font-bold text-white text-center w-full focus:outline-none placeholder-white/5"
                  />
              </div>
              <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Available: $1,250.00</p>
          </div>

          {/* Strategy Confirmation (Simple) */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Strategy</span>
                  <span className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-wider italic">Regular Basis</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Hedge Type</span>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">100% Delta Neutral</span>
              </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleExecute}
            disabled={!amount || isConfirming}
            className={clsx(
                "w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95",
                isConfirming || !amount 
                  ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" 
                  : "bg-[#E2FF00] text-[#020617] shadow-[0_10px_30px_rgba(226,255,0,0.15)] hover:scale-[1.02]"
            )}
          >
              {isConfirming ? "Deploying..." : "Confirm Investment"}
          </button>
      </div>

      {/* Simple Information */}
      <div className="pt-4 px-2">
          <div className="flex gap-4 items-start">
              <ShieldCheck className="w-5 h-5 text-white/20 shrink-0" />
              <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                  Your capital is split 50/50 between Spot (Long) and Storm Trade Futures (Short). Profits are harvested from the funding spread between them. Fully automated by the Delta Bot.
              </p>
          </div>
      </div>
    </div>
  );
}
