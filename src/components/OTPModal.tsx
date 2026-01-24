"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface OTPModalProps {
  onSuccess: () => void;
}

export default function OTPModal({ onSuccess }: OTPModalProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      });

      if (!response.ok) {
        throw new Error("Invalid OTP");
      }

      onSuccess();
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg">
      <div className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
            Admin Access
          </h2>
          <p className="text-sm text-white/40">
            Enter your Google Authenticator code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-[#E2FF00]/50 transition-all"
              maxLength={6}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={otp.length !== 6 || isLoading}
            className="w-full py-4 bg-[#E2FF00] text-black rounded-2xl font-black uppercase tracking-widest hover:bg-[#E2FF00]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
