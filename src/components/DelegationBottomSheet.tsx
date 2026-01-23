"use client";

import { useState, useEffect } from "react";
import {
  X,
  Check,
  Zap,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import { usePositions } from "@/hooks/usePositions";
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import dynamic from 'next/dynamic';

const StasisStrategyBottomSheet = dynamic(() => import('./StasisStrategyBottomSheet'));

interface DelegationBottomSheetProps {
  pairId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  amount: string;
}

export default function DelegationBottomSheet({
  pairId,
  isOpen,
  onClose,
  onBack,
  amount,
}: DelegationBottomSheetProps) {
  const { createPosition } = usePositions();

  const [isConfirming, setIsConfirming] = useState(false);
  const [sessionDuration, setSessionDuration] = useState("7d");
  const [maxLoss, setMaxLoss] = useState("0");
  
  const [stasisOpen, setStasisOpen] = useState(false);
  const [stasisPreference, setStasisPreference] = useState<"CASH" | "STAKE">("CASH");

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
      setIsConfirming(false);
    }
  }, [isOpen]);

  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const handleExecute = async () => {
    if (!amount || !pairId || !wallet) return;
    const stakeAmount = parseFloat(amount);
    const lossLimit = parseFloat(maxLoss);

    if (lossLimit > stakeAmount) {
      alert("Loss Threshold cannot be higher than delegation amount.");
      return;
    }

    setIsConfirming(true);
    
    try {
        // 1. Prepare W5 Logic for ISOLATED VAULT
        const { calculateVaultAddress, buildAddExtensionBody } = await import("@/lib/w5-utils");
        const { Address, toNano } = await import("@ton/core");
        const { Buffer } = await import("buffer");
        
        // Vault Owner = Current User
        if (!wallet.account?.publicKey) {
            alert("Wallet public key not available");
            return;
        }
        const userPublicKey = Buffer.from(wallet.account.publicKey, "hex");
        const keeperAddress = Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS || "");
        
        // 2. Derive deterministic Vault Address
        const vault = await calculateVaultAddress(userPublicKey, keeperAddress);
        const vaultAddressStr = vault.address.toString();

        console.log("Calculated Vault Address:", vaultAddressStr);

        // 3. Build Transaction Bundle
        const authPayload = await buildAddExtensionBody(vault.address, keeperAddress);

        const messages = [
            // 1. Deploy & Fund
            {
                address: vaultAddressStr,
                amount: toNano((stakeAmount + 0.1).toFixed(9)).toString(), // Capital + 0.1 TON for Gas/Storage
                stateInit: vault.stateInit.toBoc().toString("base64"), // Deploy code
                payload: authPayload.toBoc().toString("base64")
            },
        ];

        const txResult = await tonConnectUI.sendTransaction({
            messages,
            validUntil: Date.now() + 5 * 60 * 1000 
        });

        // 4. Create Backend Record with Vault Address
        const res = await fetch('/api/positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pairId,
                capitalTON: stakeAmount,
                userId: wallet.account.address,
                vaultAddress: vaultAddressStr, // Store the Isolated Vault Address
                maxLossPercentage: (lossLimit / stakeAmount) || 0.20,
                delegationDuration: sessionDuration,
                txHash: txResult.boc,
                stasisPreference
            })
        });

        if (!res.ok) {
             const errData = await res.json();
             throw new Error(errData.error || "Failed to create position record");
        }
      
        alert(`Strategy Deployed via Pamelo W5 Account Successfully`);
        onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to deploy strategy: " + (err as Error).message);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen || !pairId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
  
      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-2xl bg-[#0B1221] rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto pb-6">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-[#0B1221] z-10">
            <div className="w-12 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Header */}
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
                onClick={onBack}
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

              {/* Stasis Strategy Selector */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                 <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">
                   Idle Capital Strategy
                 </label>
                 <button 
                    onClick={() => setStasisOpen(true)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex items-center justify-between group transition-all"
                 >
                    <div className="flex items-center gap-3">
                        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", stasisPreference === 'CASH' ? "bg-blue-400/20 text-blue-400" : "bg-emerald-400/20 text-emerald-400")}>
                            {stasisPreference === 'CASH' ? <ShieldCheck className="w-5 h-5"/> : <Zap className="w-5 h-5"/>}
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-white uppercase tracking-wider">
                                {stasisPreference === 'CASH' ? "Safe Harbor (Cash)" : "Yield Hunter (Stake)"}
                            </div>
                            <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                                {stasisPreference === 'CASH' ? "Risk-Free • 0% APY" : "Target ~4% APY"}
                            </div>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-black/40 text-[9px] text-[#E2FF00] font-bold uppercase tracking-widest group-hover:bg-[#E2FF00] group-hover:text-black transition-colors">
                        Change
                    </div>
                 </button>
              </div>

              {/* Render Stasis Sheet */}
              <StasisStrategyBottomSheet 
                 isOpen={stasisOpen}
                 onClose={() => setStasisOpen(false)}
                 selectedStrategy={stasisPreference}
                 onSelect={setStasisPreference}
              />

            </div>

            <button
              onClick={handleExecute}
              disabled={!amount || isConfirming}
              className={clsx(
                "w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                isConfirming || !amount
                  ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                  : "bg-[#E2FF00] text-[#020617] shadow-[0_10px_30px_rgba(226,255,0,0.15)] hover:scale-[1.02]",
              )}
            >
              {isConfirming ? (
                <>Building Session Payload...</>
              ) : (
                <>
                  Deploy Capital <Zap className="w-4 h-4" />
                </>
              )}
            </button>
            <button
                onClick={onBack}
                className="w-full text-center mt-4 text-white/40 text-xs font-bold"
            >
                Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
