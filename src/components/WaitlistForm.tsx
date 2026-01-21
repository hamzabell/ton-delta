"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-[#E2FF00] animate-in fade-in duration-500">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">
          Added to waitlist
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row items-center w-full max-w-md border border-white/5 bg-white/[0.02] p-1.5 rounded-2xl focus-within:border-[#E2FF00]/20 transition-all"
    >
      <input
        type="email"
        placeholder="Enter email address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-transparent px-4 py-3 text-xs font-medium text-white placeholder:text-white/20 outline-none"
      />
      <button
        type="submit"
        className="w-full md:w-auto bg-[#E2FF00] text-[#020617] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all"
      >
        Sign up for waitlist
      </button>
    </form>
  );
}
