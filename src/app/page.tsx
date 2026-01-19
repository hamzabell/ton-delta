"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Activity, Globe, Lock, CheckCircle2, TrendingUp, Cpu, Menu, X } from "lucide-react";
import { TonLogo, TetherLogo, StonFiLogo, CcxtLogo } from "@/components/Logos";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#E2FF00]/30 overflow-x-hidden pt-20 md:pt-0">
      
      {/* Dynamic Background Noise/Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] contrast-150 brightness-150" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3*3filter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Glow Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#E2FF00]/5 blur-[150px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#020617]/70 backdrop-blur-2xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto p-4 md:p-6 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2FF00] text-[#020617] flex items-center justify-center font-black italic tracking-tighter shadow-[0_0_30px_rgba(226,255,0,0.4)] transition-transform hover:scale-110">Δ</div>
            <span className="font-black text-2xl tracking-tighter shrink-0 uppercase italic">Ton Delta</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
            <Link href="/dashboard" className="hover:text-white transition-colors border-b-2 border-[#E2FF00]">Dashboard</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:block text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">Sign In</Link>
            <Link href="/dashboard" className="bg-[#E2FF00] text-[#020617] px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-tight transition-all shadow-[0_0_30px_rgba(226,255,0,0.2)] hover:shadow-[0_0_40px_rgba(226,255,0,0.4)] active:scale-95">
              Launch App
            </Link>
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#020617] border-t border-white/5 p-8 flex flex-col gap-6 font-black uppercase tracking-widest text-sm text-white/60">
            <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-24 md:pt-48 pb-20 px-6 max-w-6xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#E2FF00] font-black tracking-[0.2em] uppercase text-[9px] mb-10 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-[#E2FF00] animate-pulse shadow-[0_0_15px_#E2FF00]"></div>
          The Market-Neutral Standard on TON
        </div>
        
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black leading-[0.85] mb-10 tracking-[ -0.05em] uppercase italic">
          Sophisticated Yield.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#E2FF00] to-[#b8d100]">Zero Price Risk.</span>
        </h1>
        
        <p className="text-base md:text-xl text-white/40 mb-14 max-w-2xl mx-auto leading-relaxed font-bold">
          Secure the spread between spot and futures automatically. Our automated custodial vaults maintain a <span className="text-white">Delta-Neutral</span> hedge 24/7 via swap.coffee.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-5">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-white text-[#020617] px-12 py-5 rounded-full font-black text-lg uppercase tracking-tight transition-all hover:scale-105 shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95">
              Launch Delta Vault
            </button>
          </Link>
          <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 backdrop-blur-3xl text-white border border-white/10 px-12 py-5 rounded-full font-black uppercase text-sm tracking-widest transition-all active:scale-95">
            Read Whitepaper
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 mt-32 p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] bg-white/[0.03] border border-white/5 backdrop-blur-xl">
          {[
            { label: "Average APR", val: "42.5%", italic: true },
            { label: "Total TVL", val: "$14.2M", italic: true },
            { label: "Position Delta", val: "0.00", italic: false },
            { label: "Safety Score", val: "A+", italic: true }
          ].map((m, i) => (
            <div key={i} className="text-center p-4">
              <div className={cn("text-3xl md:text-5xl font-black tracking-tighter mb-2 uppercase", m.italic && "italic")}>{m.val}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">{m.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Strategy Breakdown */}
      <section className="py-24 md:py-48 px-6 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-32">
          <div className="w-full lg:w-1/2 text-left">
            <div className="text-[#E2FF00] font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center gap-3">
              <div className="w-8 h-px bg-[#E2FF00]/50"></div> Execution Engine
            </div>
            <h2 className="text-5xl md:text-7xl font-black leading-[0.9] mb-10 tracking-tight uppercase italic">
              Stop guessing.<br/>
              <span className="text-white/20">Secure the yield.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/40 mb-12 leading-relaxed font-bold">
              Basis trading captures the difference between spot prices and perp futures. By automating this strategy, TON Delta removes market volatility from the yield equation.
            </p>
            <ul className="grid sm:grid-cols-1 gap-6">
              {[
                "100% On-chain custodial transparency",
                "Automated rebalancing via swap.coffee API",
                "Real-time risk health monitoring"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-5 font-black text-white/70 uppercase text-xs tracking-wider group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#E2FF00] transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-[#E2FF00]" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* High-Fid Visual */}
          <div className="w-full lg:w-1/2 group">
             <div className="relative p-10 md:p-16 rounded-[3rem] md:rounded-[5rem] bg-white/[0.04] border border-white/5 backdrop-blur-3xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E2FF00]/5 to-transparent opacity-50"></div>
                
                <div className="relative z-10 space-y-12">
                   <div className="flex items-center gap-8 group/item">
                     <div className="w-12 h-12 rounded-2xl bg-[#E2FF00] text-[#020617] flex items-center justify-center shadow-[0_0_30px_rgba(226,255,0,0.3)] transform -rotate-12">
                       <TrendingUp className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#E2FF00] mb-1">Long Path</div>
                        <div className="text-xl md:text-3xl font-black tracking-tighter uppercase italic">swap.coffee Spot</div>
                     </div>
                   </div>

                   <div className="h-px w-full bg-white/5 border-t border-dashed border-white/10 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 p-2 rounded-full border border-white/10 animate-pulse">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                   </div>

                   <div className="flex items-center gap-8 group/item">
                     <div className="w-12 h-12 rounded-2xl bg-white border border-white/20 text-[#020617] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] transform rotate-12">
                       <ShieldCheck className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Hedge Path</div>
                        <div className="text-xl md:text-3xl font-black tracking-tighter uppercase italic">Storm Perps</div>
                     </div>
                   </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Balanced</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Engineered for Certainty */}
      <section className="py-24 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 md:gap-24">
            {[
              { 
                title: "Atomic Swaps", 
                icon: Zap, 
                desc: "Every rebalance is executed as an atomic bundle using swap.coffee's advanced routing engine." 
              },
              { 
                title: "Risk Engine", 
                icon: Cpu, 
                desc: "Proprietary software monitors market liquidations and funding shifts every 60 seconds." 
              },
              { 
                title: "Custodian Tier", 
                icon: Lock, 
                desc: "Your assets are held in segregated smart-contract vaults with verifiable proof-of-reserves." 
              }
            ].map((f, i) => (
              <div key={i} className="text-left group">
                <div className="mb-8 p-4 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-[#E2FF00] group-hover:text-[#020617] transition-all duration-500">
                  <f.icon className="w-full h-full" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic italic">{f.title}</h3>
                <p className="text-white/40 leading-relaxed font-bold group-hover:text-white/60 transition-colors">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <footer className="relative pt-48 pb-24 px-6 overflow-hidden">
        {/* Slanted Accent */}
        <div className="absolute inset-0 bg-[#E2FF00] transform skew-y-3 translate-y-[30%] md:translate-y-48 scale-150 origin-bottom"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h2 className="text-7xl sm:text-9xl md:text-[12rem] font-black text-[#020617] leading-[0.8] mb-12 tracking-[-0.05em] uppercase italic">
            Yield is<br/>Certain.
          </h2>

          <Link href="/dashboard">
            <button className="bg-[#020617] text-white px-16 py-6 md:px-24 md:py-8 rounded-full font-black text-xl md:text-3xl uppercase tracking-tighter transition-all hover:scale-110 shadow-[0_40px_80px_rgba(0,0,0,0.4)] active:scale-95">
              Get Started Now
            </button>
          </Link>

          <div className="mt-64 flex flex-col md:flex-row justify-between items-end gap-12 border-t border-[#020617]/10 pt-12">
            <div className="text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#020617] text-white flex items-center justify-center font-black italic tracking-tighter text-2xl">Δ</div>
                <span className="text-4xl font-black uppercase text-[#020617] tracking-tighter leading-none italic">Ton Delta</span>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#020617]/40 max-w-xs">
                The institutional-grade market neutral yield standard on the TON blockchain.
              </p>
            </div>
            
            <div className="w-full md:w-auto text-left md:text-right space-y-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#020617]">
               <div className="flex justify-between md:justify-end gap-10">
                 <Link href="/dashboard" className="opacity-50 hover:opacity-100 transition-opacity">Launch App</Link>
               </div>
               <div className="opacity-30 flex justify-between md:justify-end gap-10">
                 <span>© 2026 TON DELTA</span>
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
