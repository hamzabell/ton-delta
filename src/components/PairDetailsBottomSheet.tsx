"use client";

import { useState, useEffect } from "react";
import {
  X,
  Zap,
  Shield,
  Flame,
  Clock,
  Settings2,
  AlertTriangle
} from "lucide-react";
import clsx from "clsx";
import { usePair } from "@/hooks/usePairs";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";

interface PairDetailsBottomSheetProps {
  pairId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PairDetailsBottomSheet({
  pairId,
  isOpen,
  onClose,
}: PairDetailsBottomSheetProps) {
  const { balance, isConnected, isLoading: isBalanceLoading } = useWalletBalance();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  
  // Real Data Hooks
  const { pair, isLoading: isPairLoading } = usePair(pairId || "");

  const [amount, setAmount] = useState("");
  const [sessionDuration, setSessionDuration] = useState("7d");
  const [maxLoss, setMaxLoss] = useState("0");
  const [stasisPreference, setStasisPreference] = useState<"CASH" | "STAKE">("STAKE");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Smart Defaults for Negative Funding
  const isNegativeFunding = pair ? pair.fundingRate < 0 : false;
  
  // Auto-set max loss to 50% of amount
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const val = parseFloat(amount);
      setMaxLoss((val / 2).toString());
    }
  }, [amount]);

  if (!isOpen || !pairId) return null;
  
  const currentYield = pair ? `${pair.apr}%` : "";

  const handleExecute = async () => {
    if (!wallet || !pair) return;
    if (!amount) return;

    setIsConfirming(true);
    
    try {
        const stakeAmount = parseFloat(amount);
        const lossLimit = parseFloat(maxLoss);

        // 1. Prepare W5 Logic
        const { calculateVaultAddress } = await import("@/lib/w5-utils");
        const { Address, toNano } = await import("@ton/core");
        const { Buffer } = await import("buffer");
        
        if (!wallet.account?.publicKey) throw new Error("Wallet public key not available");
        
        const userPublicKey = Buffer.from(wallet.account.publicKey, "hex");
        const keeperAddress = Address.parse(process.env.NEXT_PUBLIC_KEEPER_ADDRESS || "");
        
        // 2. Derive Vault Address
        const vault = await calculateVaultAddress(userPublicKey, keeperAddress);
        const vaultAddressStr = vault.address.toString();

        // 3. Send Transaction
        const messages = [{
            address: vaultAddressStr,
            amount: toNano((stakeAmount + 0.1).toFixed(9)).toString(),
            stateInit: vault.stateInit.toBoc().toString("base64"),
            payload: undefined
        }];

        const txResult = await tonConnectUI.sendTransaction({
            messages,
            validUntil: Date.now() + 5 * 60 * 1000 
        });

        // 4. Create Backend Record
        // Determine initial status based on preference
        let initialStatus = undefined;
        if (isNegativeFunding) {
            initialStatus = stasisPreference === 'STAKE' ? 'stasis_pending_stake' : 'stasis_active'; // Cash stasis is just active waiting
        }

        await fetch('/api/positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pairId,
                capitalTON: stakeAmount,
                userId: wallet.account.address,
                vaultAddress: vaultAddressStr,
                maxLossPercentage: (lossLimit / stakeAmount) || 0.20,
                delegationDuration: sessionDuration,
                txHash: txResult.boc,
                // Smart Default Overrides
                initialStatus,
                stasisPreference: isNegativeFunding ? stasisPreference : 'CASH' // Default preference if normal entry
            })
        });
      
        const message = isNegativeFunding 
            ? `Vault Deployed in Stasis Mode (${stasisPreference === 'STAKE' ? 'Liquid Stake' : 'Cash'}).` 
            : "Strategy Deployed Successfully!";
            
        alert(message);
        onClose();
        setAmount("");
    } catch (err) {
      console.error(err);
      alert("Failed: " + (err as Error).message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
  
      {(isPairLoading || !pair) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-[#0B1221] border border-white/10 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/10 border-t-[#E2FF00] rounded-full animate-spin" />
            <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Loading...</span>
          </div>
        </div>
      )}

      {!isPairLoading && pair && (
      <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-2xl bg-[#0B1221] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto pb-8">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-[#0B1221] z-10 w-full" onClick={() => setShowConfig(!showConfig)}>
            <div className="w-12 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{pair.spotToken}</h2>
                 <p className="text-[10px] text-[#E2FF00] font-bold uppercase tracking-widest mt-1">Institutional Vault</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Negative Funding Warning & Strategy Selector */}
            {isNegativeFunding && (
                <div className="space-y-3">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-start gap-3">
                        <div className="p-1.5 bg-purple-500/20 rounded-full mt-0.5">
                            <Shield className="w-3 h-3 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-0.5">
                                Negative Funding Protection
                            </p>
                            <p className="text-[10px] text-purple-200/60 leading-relaxed">
                                Basis trade disabled. Choose how to preserve capital:
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setStasisPreference("STAKE")}
                            className={clsx(
                                "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                                stasisPreference === "STAKE"
                                    ? "bg-purple-500/20 border-purple-500 text-white"
                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            <div className="text-[9px] font-bold uppercase tracking-widest mb-1">Yield Hunter</div>
                            <div className="text-xs font-black italic">Liquid Stake</div>
                            <div className="text-[9px] opacity-60 mt-0.5">~4% APY</div>
                        </button>
                        <button
                            onClick={() => setStasisPreference("CASH")}
                            className={clsx(
                                "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                                stasisPreference === "CASH"
                                    ? "bg-blue-500/20 border-blue-500 text-white"
                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            <div className="text-[9px] font-bold uppercase tracking-widest mb-1">Safe Harbor</div>
                            <div className="text-xs font-black italic">Hold Cash</div>
                            <div className="text-[9px] opacity-60 mt-0.5">0% Risk</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Target Yield</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{currentYield}</p>
                </div>
                 <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Risk Profile</p>
                    <div className="flex items-center gap-2">
                        {pair.risk === 'Conservative' ? <Shield className="w-4 h-4 text-emerald-500"/> : <Flame className="w-4 h-4 text-orange-500"/>}
                        <p className={clsx("text-lg font-black uppercase italic tracking-tighter", pair.risk === 'Conservative' ? "text-emerald-500" : "text-amber-500")}>
                            {pair.risk}
                        </p>
                    </div>
                </div>
            </div>

            {/* Input Section */}
            <div className="space-y-4 pt-2">
                <div className="relative">
                     <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-2 bg-[#0B1221] text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        Delegation Amount
                     </div>
                     <div className="border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-1">
                             <span className="text-2xl font-light text-white/20">$</span>
                             <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="bg-transparent text-5xl font-black text-white text-center w-full max-w-[200px] focus:outline-none placeholder-white/5 italic tracking-tighter"
                             />
                        </div>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                          {isBalanceLoading ? 'Loading...' : `Balance: ${isConnected ? balance.toFixed(2) : '0.00'} TON`}
                        </p>
                     </div>
                </div>
                
                {/* Minimalist Config Toggle */}
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className="w-full flex items-center justify-between px-2 group"
                >
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white/40 transition-colors flex items-center gap-2">
                        <Settings2 className="w-3 h-3" /> Configuration
                    </span>
                     <span className="text-[9px] font-bold text-[#E2FF00] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                        {sessionDuration} • Max Loss {maxLoss} T
                    </span>
                </button>

                 {/* Collapsible Config */}
                 {showConfig && (
                     <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                         <div className="space-y-2">
                             <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Duration</label>
                             <div className="grid grid-cols-5 gap-1">
                                {["1h", "24h", "7d", "30d", "1y"].map((d) => (
                                    <button
                                    key={d}
                                    onClick={() => setSessionDuration(d)}
                                    className={clsx(
                                        "py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all border",
                                        sessionDuration === d
                                        ? "bg-[#E2FF00] text-[#020617] border-[#E2FF00]"
                                        : "bg-white/5 text-white/30 border-transparent hover:bg-white/10"
                                    )}
                                    >
                                    {d}
                                    </button>
                                ))}
                             </div>
                         </div>
                         <div className="space-y-2">
                             <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Stop Loss (TON)</label>
                             <input
                                type="number"
                                value={maxLoss}
                                onChange={(e) => setMaxLoss(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-lg py-3 px-4 text-white text-xs font-bold focus:outline-none focus:border-[#E2FF00]/30"
                             />
                         </div>
                     </div>
                 )}

                {/* Primary Action */}
                <button
                    onClick={handleExecute}
                    disabled={!amount || isConfirming || (isConnected && balance === 0)}
                    className={clsx(
                        "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl",
                        !amount || (isConnected && balance === 0)
                            ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                            : isNegativeFunding
                                ? stasisPreference === 'STAKE' 
                                    ? "bg-purple-500 text-white shadow-purple-500/20 hover:bg-purple-400"
                                    : "bg-blue-500 text-white shadow-blue-500/20 hover:bg-blue-400"
                                : "bg-[#E2FF00] text-[#020617] shadow-[#E2FF00]/20 hover:scale-[1.02]"
                    )}
                >
                    {isConfirming ? (
                        "Building Payload..." 
                    ) : isNegativeFunding ? (
                         stasisPreference === 'STAKE' 
                            ? <>Deploy Liquid Stake <Shield className="w-4 h-4" /></>
                            : <>Deploy Cash Stasis <Shield className="w-4 h-4" /></>
                    ) : (
                        <>Deploy Strategy <Zap className="w-4 h-4" /></>
                    )}
                </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
