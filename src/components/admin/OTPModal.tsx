/* eslint-disable */
"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import Cookies from "js-cookie";

interface OTPModalProps {
  onSuccess: () => void;
}

export default function OTPModal({ onSuccess }: OTPModalProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-[#E2FF00]/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[#E2FF00]" />
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
            Security Check
          </h2>
          <p className="text-white/40 text-sm">
            Please enter your Google Authenticator code to access the admin dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-mono text-white placeholder:text-white/10 focus:outline-none focus:border-[#E2FF00]/50 transition-colors tracking-[0.5em]"
              placeholder="000000"
              autoFocus
              maxLength={6}
            />
            {error && (
              <p className="text-red-500 text-xs text-center font-bold uppercase tracking-wider animate-pulse">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-[#E2FF00] text-black font-black uppercase tracking-wider py-4 rounded-xl hover:bg-[#c9e300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Verify Access"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
