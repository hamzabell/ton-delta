"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Activity, Globe, Lock, Cpu } from "lucide-react";
import { TonLogo, TetherLogo, StonFiLogo, CcxtLogo } from "@/components/Logos";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/30">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">N</div>
           <span className="font-bold text-xl tracking-tight text-slate-900">Neutron</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
           <Link href="#" className="hover:text-emerald-600">Home</Link>
           <Link href="#" className="hover:text-emerald-600">Strategy</Link>
           <Link href="#" className="hover:text-emerald-600">Security</Link>
           <Link href="#" className="hover:text-emerald-600">Roadmap</Link>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">Login</Link>
           <Link href="/dashboard" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-emerald-500/30">
              Get Started
           </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32">
         <div className="relative rounded-[3rem] overflow-hidden min-h-[600px] flex items-center bg-slate-900 text-white">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0">
               <img 
                  src="/neutron_hero_bg_1768335085595.png" 
                  alt="Background" 
                  className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent"></div>
            </div>

            <div className="relative z-10 px-8 md:px-16 w-full max-w-3xl">
                <p className="text-emerald-400 font-medium mb-4 tracking-wide uppercase text-sm">#1 Delta Neutral Protocol</p>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
                   The House <br/>
                   <span className="text-emerald-400">Always Wins</span>
                </h1>
                <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
                    Access institutional-grade <strong>Basis Trading</strong> strategies. Earn yield from funding rates and spot-future spreads, immune to market crashes.
                </p>
                
                <div className="flex flex-wrap gap-4">
                   <Link href="/dashboard">
                      <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2">
                         Start Earning <ArrowRight className="w-5 h-5"/>
                      </button>
                   </Link>
                   <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg transition-all">
                      Learn Strategy
                   </button>
                </div>
            </div>

            {/* Floating Card (Reference Image Style) */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl w-72 shadow-2xl">
                    <img rounded-2xl src="/neutron_secure_vault_1768335102294.png" className="w-full h-48 object-cover rounded-2xl mb-4 opacity-90" />
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Funding Rate</span>
                          <span className="text-emerald-400 font-bold">42.5%</span>
                       </div>
                       <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-[70%] bg-emerald-500"></div>
                       </div>
                       <p className="text-xs text-slate-400">Delta Neutral • Low Risk</p>
                    </div>
                </div>
            </div>
         </div>

         {/* Stats Bar (Floating) */}
         <div className="relative -mt-16 mx-8 md:mx-16 bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row justify-around divide-y md:divide-y-0 md:divide-x divide-slate-100 z-20">
             <div className="p-4 text-center">
                 <h3 className="text-4xl font-bold text-slate-900">42%</h3>
                 <p className="text-slate-500 text-sm mt-1">Average APY</p>
             </div>
             <div className="p-4 text-center">
                 <h3 className="text-4xl font-bold text-slate-900">315</h3>
                 <p className="text-slate-500 text-sm mt-1">Active Arbitrageurs</p>
             </div>
             <div className="p-4 text-center">
                 <h3 className="text-4xl font-bold text-slate-900">$12M</h3>
                 <p className="text-slate-500 text-sm mt-1">Basis Locked</p>
             </div>
         </div>
      </header>

      {/* Brand Section ("Focusing on quality") */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
             <h2 className="text-4xl md:text-5xl font-bold text-slate-900 max-w-xl leading-tight">
                 We eliminate <span className="text-emerald-600">price risk</span>,<br/>
                 you keep the yield
             </h2>
             <p className="text-slate-500 max-w-md text-lg leading-relaxed">
                 By shorting the future and buying the spot, we neutralize market volatility. The result is pure, uncorrelated alpha.
             </p>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-items-center opacity-70 grayscale transition-all duration-500 hover:grayscale-0">
             <div className="flex items-center gap-3 group cursor-default">
                 <TonLogo className="w-16 h-16 shadow-lg shadow-blue-500/10 rounded-full group-hover:scale-110 transition-transform"/>
                 <span className="font-bold text-xl text-slate-800">TON</span>
             </div>
             <div className="flex items-center gap-3 group cursor-default">
                 <TetherLogo className="w-14 h-14 shadow-lg shadow-emerald-500/10 rounded-full group-hover:scale-110 transition-transform"/>
                 <span className="font-bold text-xl text-slate-800">Tether</span>
             </div>
             <div className="flex items-center gap-3 group cursor-default">
                 <StonFiLogo className="w-14 h-14 shadow-lg shadow-emerald-500/10 rounded-full group-hover:scale-110 transition-transform"/>
                 <span className="font-bold text-xl text-slate-800">STON.fi</span>
             </div>
             <div className="flex items-center gap-3 group cursor-default">
                <CcxtLogo className="w-14 h-14 shadow-lg shadow-slate-500/10 rounded-lg group-hover:scale-110 transition-transform"/>
                 <div className="flex flex-col">
                    <span className="font-bold text-xl text-slate-800 leading-none">CCXT</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Binance/Bybit</span>
                 </div>
             </div>
         </div>
      </section>

      {/* Feature Grid ("We offer quality") */}
      <section className="bg-slate-50 py-20 px-6">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      Institutional <span className="text-emerald-600">Mechanics</span>,<br/>
                      Simplified
                  </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  {[
                      { title: "Funding Arbitrage", icon: Zap, desc: "Shorts perps to collect funding fees while holding spot to neutralize price action." },
                      { title: "Basis Trading", icon: Activity, desc: "Captures the fixed spread between Spot and Dated Futures contracts." },
                      { title: "Delta Neutral LP", icon: Cpu, desc: "Provides Liquidity to DEXs while hedging inventory risk on CEXs." },
                      { title: "Non-Custodial Spot", icon: Lock, desc: "Your spot assets live in your wallet / contract, not ours." },
                      { title: "Auto-Rebalancing", icon: ShieldCheck, desc: "Bots monitor LTV ratios every minute to prevent liquidation." },
                      { title: "Proof of Reserves", icon: Globalization, desc: "Live dashboard showing solvency across On-Chain and Off-Chain venues." }
                  ].map((f, i) => (
                      <div key={i} className="bg-white p-8 rounded-3xl hover:shadow-xl transition-shadow border border-slate-100 group">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <f.icon className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-lg mb-3">{f.title}</h3>
                          <p className="text-slate-500 leading-relaxed text-sm">
                              {f.desc}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Spotlight Section ("Trusted Service") */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-1/2 space-y-8">
                  <h2 className="text-4xl font-bold leading-tight">
                      Trusted service, <span className="text-slate-400">for your</span><br/>
                      various assets
                  </h2>
                  <Link href="/dashboard">
                     <button className="bg-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-600 transition-colors">
                         Get in Touch
                     </button>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-4 pt-8">
                      <div className="p-6 rounded-2xl border border-slate-200">
                          <span className="text-emerald-600 font-bold block mb-2">01</span>
                          <h4 className="font-bold mb-2">Funding Rates for Yield</h4>
                          <span className="text-xs text-slate-400 underline">View Details</span>
                      </div>
                      <div className="p-6 rounded-2xl border border-slate-200">
                          <span className="text-emerald-600 font-bold block mb-2">02</span>
                          <h4 className="font-bold mb-2">Short Futures for Hedge</h4>
                           <span className="text-xs text-slate-400 underline">View Details</span>
                      </div>
                  </div>
              </div>
              
              <div className="w-full md:w-1/2 relative bg-slate-900 rounded-[3rem] overflow-hidden min-h-[500px] flex items-center justify-center">
                    <img 
                      src="/neutron_secure_vault_1768335102294.png" 
                      className="relative z-10 w-[80%] drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-[url('/neutron_hero_bg_1768335085595.png')] opacity-30 mix-blend-overlay"></div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-20 px-6 rounded-t-[3rem] mt-12">
          <div className="max-w-7xl mx-auto text-center space-y-12">
              <h2 className="text-3xl md:text-5xl font-bold">
                  It's time to support zero risk,<br/>
                  with <span className="text-emerald-400">delta neutral</span> strategies
              </h2>
              
              <div className="flex justify-center gap-8">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium">Experienced since 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium">Audited Automation</span>
                  </div>
              </div>

               <Link href="/dashboard">
                  <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                      Go to App
                  </button>
               </Link>

               <div className="pt-20 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                   <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">N</div>
                       <span className="font-bold text-white">Neutron</span>
                   </div>
                   <div className="flex gap-8">
                       <a href="#" className="hover:text-white">Home</a>
                       <a href="#" className="hover:text-white">About Us</a>
                       <a href="#" className="hover:text-white">Features</a>
                       <a href="#" className="hover:text-white">Contact</a>
                   </div>
                   <div>
                       © 2025 Neutron Finance. All rights reserved.
                   </div>
               </div>
          </div>
      </footer>
    </div>
  );
}

// Icon component needed that wasn't imported
function Globalization({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    )
}
