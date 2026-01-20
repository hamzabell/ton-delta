"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, Check, X, Lock, Cpu, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTonWallet } from "@tonconnect/ui-react";
import clsx from "clsx";

import { Zap, Shield, Flame, Info, AlertTriangle } from "lucide-react";

const PAIR_DATA: Record<string, any> = {
  "usdt-ton": { base: "USDT", quote: "TON", yield: "24.5%", risk: "Low", category: "Stable", desc: "Delta-neutral basis capture on USDT/TON liquidity." },
  "usdt-dogs": { base: "USDT", quote: "DOGS", yield: "142.3%", risk: "High", category: "Meme", desc: "Aggressive yields from high-volume meme trading pairs." },
  "usdt-not": { base: "USDT", quote: "NOT", yield: "115.8%", risk: "High", category: "Meme", desc: "High-reward strategy targeting Notcoin liquidity cycles." },
  "usdt-redo": { base: "USDT", quote: "REDO", yield: "185.0%", risk: "High", category: "Meme", desc: "Resistance Dog (REDO) basis capture with extreme yield potential." },
};

export default function TradePage() {
  const params = useParams();
  const pairId = (params.id as string) || "usdt-ton";
  const data = PAIR_DATA[pairId] || PAIR_DATA["usdt-ton"];

  const [amount, setAmount] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Non-Custodial States
  const [isAAContractDeployed, setIsAAContractDeployed] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionDuration, setSessionDuration] = useState("7d");
  const [maxLoss, setMaxLoss] = useState("50");

  // Auto-set max loss to 50% of amount
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const val = parseFloat(amount);
      setMaxLoss((val / 2).toString());
    }
  }, [amount]);

  const handleDeployAA = () => {
    setIsDeploying(true);
    setTimeout(() => {
        setIsAAContractDeployed(true);
        setIsDeploying(false);
    }, 2000);
  };

  const handleExecute = () => {
    if (!amount) return;
    const stakeAmount = parseFloat(amount);
    const lossLimit = parseFloat(maxLoss);

    if (lossLimit > stakeAmount) {
        alert("Loss Threshold cannot be higher than delegation amount.");
        return;
    }

    if (!isAAContractDeployed) {
        handleDeployAA();
        return;
    }

    if (!isSessionActive) {
        setShowSessionModal(true);
        return;
    }
    
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setAmount("");
      alert(`Strategy Deployed via Pamelo W5 Account Successfully`);
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
            <h1 className="text-xl font-bold text-white tracking-tight italic uppercase">{data.base} / {data.quote}</h1>
            <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-widest italic">USDT Sovereignty</p>
        </div>
      </div>

      {/* Yield Summary Card */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex justify-between items-center group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {data.risk === "Low" ? <Shield className="w-16 h-16" /> : <Flame className="w-16 h-16" />}
          </div>
          <div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Target Yield</p>
              <p className="text-4xl font-black text-white italic tracking-tighter">{data.yield}</p>
          </div>
          <div className="text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Risk Profile</p>
              <p className={clsx(
                  "text-lg font-black uppercase italic",
                  data.risk === "Low" ? "text-emerald-500" : "text-amber-500"
              )}>{data.risk}</p>
          </div>
      </div>

      {/* Strategy Description */}
      <div className="px-1">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed">
             {data.desc}
          </p>
      </div>

      {/* Main Input Section */}
      <div className="space-y-6">
          <div className="text-center space-y-4 py-8">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Delegation Amount (USDT)</p>
              <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-light text-white/20">$</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-5xl font-black text-white text-center w-full focus:outline-none placeholder-white/5 italic"
                  />
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Pamelo Account: $1,250.00 USDT</p>
          </div>

          {/* Non-Custodial Strategy Details */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Restricted Session</span>
                  <span className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider italic",
                      isSessionActive ? "text-[#E2FF00]" : "text-white/20"
                  )}>
                      {isSessionActive ? `Active (${sessionDuration})` : "Unauthorized"}
                  </span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Account Standard</span>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider italic">TON W5 AA</span>
              </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleExecute}
            disabled={!amount || isConfirming || isDeploying}
            className={clsx(
                "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                (isConfirming || !amount || isDeploying)
                  ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" 
                  : !isAAContractDeployed
                    ? "bg-[#E2FF00] text-[#020617] shadow-[0_10px_30px_rgba(226,255,0,0.15)] hover:scale-[1.02]"
                    : isSessionActive 
                      ? "bg-[#E2FF00] text-[#020617] shadow-[0_10px_30px_rgba(226,255,0,0.15)] hover:scale-[1.02]"
                      : "bg-white text-[#020617] hover:scale-[1.02]"
            )}
          >
              {isConfirming ? (
                  <>Building Session Payload...</>
              ) : isDeploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" />
                    Initializing W5...
                  </>
              ) : !isAAContractDeployed ? (
                  <>Initialize Pamelo Infrastructure <Cpu className="w-4 h-4" /></>
              ) : isSessionActive ? (
                  <>Deploy Capital <Zap className="w-4 h-4" /></>
              ) : (
                  <>Authorize Session to Trade <Clock className="w-4 h-4" /></>
              )}
          </button>
      </div>

      {/* Risk Information */}
      <div className="pt-4 px-2 space-y-4">
          <div className="flex gap-4 items-start p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Risk Disclosure</p>
                  <p className="text-[9px] text-amber-500/60 font-medium leading-relaxed">
                      {data.risk === "High" 
                        ? "Meme coin strategies involve extreme volatility. Your max loss safeguard is critical for high-gain participation." 
                        : "Stable yield strategies focus on capital preservation. Minimal historical drawdown recorded via swap.coffee."}
                  </p>
              </div>
          </div>
          <div className="flex gap-4 items-start px-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-white/20" />
              </div>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider leading-relaxed">
                  Platform only earns 20% performance fee on net profits. Principal is never subject to fees.
              </p>
          </div>
      </div>

      {/* Session Auth Modal */}
      {showSessionModal && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center px-6 pb-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Budgeted Delegation</h3>
                          <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-widest">Configure Safeguards</p>
                      </div>
                      <button onClick={() => setShowSessionModal(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-white/40" /></button>
                  </div>

                  <div className="space-y-6 mb-10">
                      {/* Session Length Selection */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Delegation Period</label>
                        <div className="grid grid-cols-5 gap-1.5">
                             {['1h', '24h', '7d', '30d', '1y'].map((d) => (
                                 <button 
                                   key={d}
                                   onClick={() => setSessionDuration(d)}
                                   className={clsx(
                                       "py-3 rounded-xl border font-bold text-[8px] uppercase tracking-widest transition-all",
                                       sessionDuration === d 
                                         ? "bg-[#E2FF00] text-[#020617] border-[#E2FF00]" 
                                         : "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
                                   )}
                                 >
                                     {d}
                                 </button>
                             ))}
                        </div>
                      </div>

                      {/* Max Loss Selection */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Loss Threshold (USDT)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={maxLoss}
                                onChange={(e) => setMaxLoss(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold focus:outline-none focus:border-[#E2FF00]/50 transition-all italic"
                                placeholder="Enter limit..."
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#E2FF00] uppercase italic">
                                USDT CAP
                            </div>
                        </div>
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest px-1">Secure session terminates if USDT losses hit this ceiling. Defaulted to 50% of stake.</p>
                      </div>
                      
                      <div className="flex gap-3 items-start p-3 bg-white/5 rounded-xl">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <p className="text-[9px] text-white/40 leading-relaxed font-bold uppercase tracking-wider">
                              W5 Session Key restricted to USDT pairs only. No global withdrawal rights.
                          </p>
                      </div>
                  </div>

                  <button 
                    onClick={() => { setIsSessionActive(true); setShowSessionModal(false); }}
                    className="w-full bg-white text-[#020617] py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                  >
                      Authorize Delegation
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
