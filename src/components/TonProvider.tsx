"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode, useEffect } from "react";

export function TonProvider({ children }: { children: ReactNode }) {
  // Use a manifest with proper CORS headers (Access-Control-Allow-Origin: *)
  // fantasypro.app missing this header causes the wallet fetch to fail.
  const manifestUrl = "https://pamelo-finance.netlify.app/tonconnect-manifest.json";

  // Initialize background service on mount
  useEffect(() => {
    const initBackgroundService = async () => {
      try {
        const response = await fetch('/api/background');
        const data = await response.json();
        if (data.success) {
          console.log('[Background Service] Initialized:', data.jobs);
        } else {
          console.error('[Background Service] Failed to initialize:', data.error);
        }
      } catch (error) {
        console.error('[Background Service] Error:', error);
      }
    };

    initBackgroundService();
  }, []);

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
    >
      {children}
    </TonConnectUIProvider>
  );
}

