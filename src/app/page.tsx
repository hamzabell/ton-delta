"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Activity, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#E2FF00]/20 overflow-x-hidden">
      
      {/* Subtle Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-xl">🍈</div>
            <span className="font-bold text-lg tracking-tight uppercase">Pamelo.finance</span>
          </div>
          <Link href="/dashboard" className="bg-white/5 border border-white/10 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all">
             Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 text-center">
         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E2FF00]/10 border border-[#E2FF00]/20 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E2FF00] animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E2FF00]">TON Native High-Yield</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.9] mb-8 uppercase">
           DELEGATED<br />SOVEREIGNTY.
         </h1>
         <p className="max-w-md mx-auto text-sm md:text-base text-white/40 font-medium leading-relaxed mb-12 px-4 uppercase tracking-wider">
           Earn high-yield returns on USDT/TON and TON-native meme pairs. Predefine your risk, delegate to Pamelo.
         </p>
         
         <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="w-full md:w-auto bg-[#E2FF00] text-[#020617] px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_20px_40px_rgba(226,255,0,0.1)]"
            >
              Start Earning
            </Link>
            <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/5">
                <ShieldCheck className="w-4 h-4 text-white/20" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Non-Custodial W5 Deployment</span>
            </div>
         </div>
      </section>

      {/* Simple Stats Row */}
      <section className="py-20 border-t border-white/5">
         <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 md:gap-x-16">
             <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1.5">Avg. Stable Yield</p>
                <p className="text-4xl md:text-6xl font-bold text-white tracking-tighter italic">24.5%</p>
             </div>
             <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1.5">Meme APR Cap</p>
                <p className="text-4xl md:text-6xl font-bold text-white tracking-tighter italic">140%+</p>
             </div>
             <div className="col-span-2 md:col-span-1 text-center md:text-left">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1.5">Model</p>
                <p className="text-4xl md:text-6xl font-bold text-[#E2FF00] tracking-tighter italic">USDT Base</p>
             </div>
         </div>
      </section>

      {/* How It Works - Rebranded */}
      <section className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-[0.4em] mb-16 text-center">Protocol Workflow</h2>
            <div className="grid md:grid-cols-3 gap-16">
                {[
                  { step: "01", title: "Initialize", desc: "Deploy your secure, non-custodial W5 Pamelo Account. Your funds remain yours." },
                  { step: "02", title: "Authorize", desc: "Define your delegation period and Max Loss safeguard. Grant restricted access." },
                  { step: "03", title: "Harvest", desc: "Our engine captures yield on USDT pairs. We only take a 20% cut when you profit." }
                ].map((item, i) => (
                  <div key={i} className="space-y-4">
                      <p className="text-3xl font-black italic text-white/10">{item.step}</p>
                      <h3 className="text-lg font-bold text-white uppercase italic tracking-tighter">{item.title}</h3>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed">{item.desc}</p>
                  </div>
                ))}
            </div>
         </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-12 border-t border-white/5 text-center px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="text-lg">🍈</div>
            <span className="font-bold text-sm tracking-tight uppercase">Pamelo.finance</span>
          </div>
          <p className="text-[10px] font-medium text-white/20 uppercase tracking-[0.3em]">© 2026 Institutional Grade Basis Yield</p>
      </footer>
    </div>
  );
}
