"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

export function TonProvider({ children }: { children: ReactNode }) {
  // In a real app, manage this URL better (env var or absolute URL)
  // For dev, we point to the public file.
  const manifestUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/tonconnect-manifest.json`
    : '';

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
