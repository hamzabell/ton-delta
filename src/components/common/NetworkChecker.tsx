
"use client";

import { useTonWallet, CHAIN } from "@tonconnect/ui-react";
import { AlertTriangle } from "lucide-react";
import { IS_TESTNET } from "@/lib/config";

export function NetworkChecker() {
  const wallet = useTonWallet();

  // Derive state directly during render
  const isWrongNetwork = (() => {
    if (!wallet) return false;
    
    if (IS_TESTNET) {
       // We expect Testnet (-3). blocked if Mainnet (-239)
       return wallet.account.chain === CHAIN.MAINNET;
    } else {
       // We expect Mainnet (-239).
       return wallet.account.chain === CHAIN.TESTNET;
    }
  })();

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
      <div className="bg-amber-500/10 border border-amber-500/50 backdrop-blur-md text-amber-500 p-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <div className="text-xs font-bold uppercase tracking-wide">
          <p className="mb-1">Wrong Network Detected</p>
          <p className="text-amber-500/80 normal-case font-medium">
            App is in <strong>{IS_TESTNET ? "TESTNET" : "MAINNET"}</strong> mode. 
            Please switch your wallet to {IS_TESTNET ? "Testnet" : "Mainnet"}.
          </p>
        </div>
      </div>
    </div>
  );
}
