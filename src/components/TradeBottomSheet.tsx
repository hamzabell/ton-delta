"use client";

import { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Check,
  Lock,
  Cpu,
  Clock,
  Zap,
  Shield,
  Flame,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { usePair } from "@/hooks/usePairs";
import { useMarketData } from "@/hooks/useMarketData";
import { usePositions } from "@/hooks/usePositions";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface TradeBottomSheetProps {
  pairId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TradeBottomSheet({
  pairId,
  isOpen,
  onClose,
}: TradeBottomSheetProps) {
  const { balance, isConnected } = useWalletBalance();
  
  // Real Data Hooks
  const { pair, isLoading: isPairLoading } = usePair(pairId || "");
  const { data: marketData } = useMarketData(pairId || "");
  const { createPosition } = usePositions();

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

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setIsConfirming(false);
      setShowSessionModal(false);
    }
  }, [isOpen]);

  const handleDeployAA = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsAAContractDeployed(true);
      setIsDeploying(false);
    }, 2000);
  };

  const handleExecute = async () => {
    if (!amount || !pairId) return;
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
    
    try {
      await createPosition(pairId, stakeAmount);
      
      setAmount("");
      alert(`Strategy Deployed via Pamelo W5 Account Successfully`);
      onClose();
    } catch (err) {
      alert("Failed to deploy strategy: " + err);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen || !pairId) return null;
  if (isPairLoading || !pair) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-[#0B1221] rounded-t-3xl p-8">
          <div className="text-white/20">Loading...</div>
        </div>
      </div>
    );
  }

  const currentYield = `${pair.apr}%`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-2xl bg-[#0B1221] rounded-t-3xl shadow-2xl max-h-[75vh] overflow-y-auto pb-24">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-[#0B1221] z-10">
            <div className="w-12 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-lg font-bold text-white tracking-tight italic uppercase">
                  {pair.spotToken} / {pair.baseToken}
                </h1>
                <p className="text-[9px] text-[#E2FF00] font-bold uppercase tracking-widest italic">
                  TON Native Yield
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Yield Summary Card - Compact */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">
                  Target Yield
                </p>
                <p className="text-2xl font-black text-white italic tracking-tighter">
                  {currentYield}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">
                  Risk
                </p>
                <p
                  className={clsx(
                    "text-sm font-black uppercase italic",
                    pair.risk === "Low" ? "text-emerald-500" : "text-amber-500",
                  )}
                >
                  {pair.risk}
                </p>
              </div>
            </div>

            {/* Main Input Section - Compact */}
            <div className="space-y-4">
              <div className="text-center space-y-3 py-4">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  Delegation Amount (TON)
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-light text-white/20">T</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-4xl font-black text-white text-center w-full focus:outline-none placeholder-white/5 italic"
                  />
                </div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  {isConnected ? `Balance: ${balance.toFixed(2)} TON` : "Connect Wallet"}
                </p>
              </div>

              {/* Non-Custodial Strategy Details - Compact */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                    Session
                  </span>
                  <span
                    className={clsx(
                      "text-[9px] font-bold uppercase tracking-wider italic",
                      isSessionActive ? "text-[#E2FF00]" : "text-white/20",
                    )}
                  >
                    {isSessionActive ? `Active (${sessionDuration})` : "Unauthorized"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                    Standard
                  </span>
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider italic">
                    W5 AA
                  </span>
                </div>
              </div>

              {/* Action Button - Compact */}
              <button
                onClick={handleExecute}
                disabled={!amount || isConfirming || isDeploying}
                className={clsx(
                  "w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                  isConfirming || !amount || isDeploying
                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                    : !isAAContractDeployed
                      ? "bg-[#E2FF00] text-[#020617] shadow-[0_10px_30px_rgba(226,255,0,0.15)] hover:scale-[1.02]"
                      : isSessionActive
                        ? "bg-[#E2FF00] text-[#020617] shadow-[0_10px_30px_rgba(226,255,0,0.15)] hover:scale-[1.02]"
                        : "bg-white text-[#020617] hover:scale-[1.02]",
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
                  <>
                    Initialize Pamelo Infrastructure <Cpu className="w-4 h-4" />
                  </>
                ) : isSessionActive ? (
                  <>
                    Deploy Capital <Zap className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Authorize Session to Trade <Clock className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Auth Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-6 pb-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">
                  Budgeted Delegation
                </h3>
                <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-widest">
                  Configure Safeguards
                </p>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="p-2 hover:bg-white/5 rounded-full"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            <div className="space-y-6 mb-10">
              {/* Session Length Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">
                  Delegation Period
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["1h", "24h", "7d", "30d", "1y"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSessionDuration(d)}
                      className={clsx(
                        "py-3 rounded-xl border font-bold text-[8px] uppercase tracking-widest transition-all",
                        sessionDuration === d
                          ? "bg-[#E2FF00] text-[#020617] border-[#E2FF00]"
                          : "bg-white/5 text-white/40 border-white/5 hover:border-white/10",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Loss Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">
                  Loss Threshold (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxLoss}
                    onChange={(e) => setMaxLoss(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold focus:outline-none focus:border-[#E2FF00]/50 transition-all italic"
                    placeholder="Enter limit..."
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#E2FF00] uppercase italic">
                    TON CAP
                  </div>
                </div>
                <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest px-1">
                  Secure session terminates if USDT losses hit this ceiling.
                  Defaulted to 50% of stake.
                </p>
              </div>

              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-xl">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-[9px] text-white/40 leading-relaxed font-bold uppercase tracking-wider">
                  W5 Session Key restricted to TON-native pairs only. No global
                  withdrawal rights.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSessionActive(true);
                setShowSessionModal(false);
              }}
              className="w-full bg-white text-[#020617] py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
              Authorize Delegation
            </button>
          </div>
        </div>
      )}
    </>
  );
}
