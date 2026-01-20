"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Activity, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

function CountUp({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function: outExpo
      const easedPercentage = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      const nextCount = easedPercentage * end;
      setCount(nextCount);
      
      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString(undefined, { minimumFractionDigits: count % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}{suffix}</span>;
}

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

      {/* Refined Stats Section - Scaled Down */}
      <section className="py-16 border-t border-white/5 relative overflow-hidden">
         {/* Decorative background element */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#E2FF00]/5 blur-[100px] rounded-full pointer-events-none"></div>
         
         <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {[
                  { label: "Avg. Stable Yield", value: 24.5, suffix: "%", color: "text-white" },
                  { label: "Meme APR Cap", value: 140, suffix: "%+", color: "text-white" },
                  { label: "Model", value: "USDT Base", color: "text-[#E2FF00]" }
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className="group relative bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                  >
                    <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-40 transition-opacity">
                       <Zap className="w-3 h-3 text-[#E2FF00]" />
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-3">{stat.label}</p>
                    <p className={`text-4xl lg:text-5xl font-black ${stat.color} tracking-tighter italic leading-none`}>
                      {typeof stat.value === 'number' ? (
                        <CountUp end={stat.value} suffix={stat.suffix} />
                      ) : (
                        stat.value
                      )}
                    </p>
                    
                    {/* Subtle Hover Glow */}
                    <div className="absolute inset-0 rounded-3xl bg-[#E2FF00]/3 opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none"></div>
                  </div>
                ))}
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
