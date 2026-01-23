"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

export function TonProvider({ children }: { children: ReactNode }) {
  // Use a manifest with proper CORS headers (Access-Control-Allow-Origin: *)
  // fantasypro.app missing this header causes the wallet fetch to fail.
  const manifestUrl = "https://ton-delta.onrender.com/tonconnect-manifest.json";

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
    >
      {children}
    </TonConnectUIProvider>
  );
}
