"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import WaitlistForm from "@/components/WaitlistForm";
import Mermaid from "@/components/Mermaid";

function CountUp({
  end,
  duration = 2000,
  suffix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percentage = Math.min(progress / duration, 1);

      // Easing function: outExpo
      const easedPercentage =
        percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

      const nextCount = easedPercentage * end;
      setCount(nextCount);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString(undefined, {
        minimumFractionDigits: count % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
      })}
      {suffix}
    </span>
  );
}

const WATCHMAN_DIAGRAM = `graph TD
    A[Timer: Every 60s] --> B{Fetch Prices}
    B --> C[Fetch Spot Balance]
    B --> D[Fetch Perp Position]
    
    C & D --> E[Calculate Total Equity]
    
    E --> F{Equity < Max Loss?}
    F -- YES --> G[EMERGENCY LIQUIDATOR]
    G --> G1[Sell Spot to TON]
    G1 --> G2[Close Short Perp]
    G2 --> G3[Notify User via Telegram]
    
    F -- NO --> H{Check Delta Drift}
    H -- Drift > 1.5% --> I[REBALANCE ENGINE]
    I --> I1[Calculate Side Imbalance]
    I1 --> I2[Execute Mini-Swap / Adj. Perp]
    I2 --> J[Log Audit to Database]
    
    H -- Drift < 1.5% --> K[Collect Funding Yield]
    K --> L[Update UI Dashboard]`;

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
            <span className="font-bold text-lg tracking-tight lowercase">
              Pamelo.finance
            </span>
          </div>
          <Link
            href="/whitepaper"
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
          >
            <FileText className="w-3 h-3" />
            Whitepaper
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E2FF00]/10 border border-[#E2FF00]/20 mb-12">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E2FF00] animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#E2FF00]">
            Waitlist open
          </span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.9] mb-8 uppercase">
          INSTITUTIONAL
          <br />
          REFINER.
        </h1>
        <p className="max-w-md mx-auto text-sm md:text-base text-white/40 font-medium leading-relaxed mb-12 px-4 uppercase tracking-wider">
          Convert high-risk meme coin volatility into low-risk, TON-denominated
          yield. Basis trading for the TON ecosystem.
        </p>

        <div className="flex flex-col items-center justify-center gap-8">
          <WaitlistForm />
          <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/5">
            <ShieldCheck className="w-4 h-4 text-white/20" />
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              Non-Custodial W5 Deployment
            </span>
          </div>
        </div>
      </section>

      {/* Improved Stats Section */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#E2FF00]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: "Avg. Basis Yield",
                value: 32.5,
                suffix: "%",
                color: "text-white",
              },
              {
                label: "Meme Funding Cap",
                value: 280,
                suffix: "%+",
                color: "text-white",
              },
              { label: "Model", value: "TON Native", color: "text-[#E2FF00]" },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative bg-white/[0.01] border border-white/[0.03] p-10 rounded-[2.5rem] backdrop-blur-md hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 overflow-hidden shadow-2xl"
              >
                <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-40 transition-all duration-500">
                  <Zap className="w-5 h-5 text-[#E2FF00]" />
                </div>
                
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-4">
                  {stat.label}
                </p>
                <p
                  className={`text-5xl lg:text-6xl font-black ${stat.color} tracking-tighter italic leading-none`}
                >
                  {typeof stat.value === "number" ? (
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Improved How It Works */}
      <section className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-[0.5em] mb-20 text-center">
            Protocol Workflow
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Initialize",
                desc: "Deploy your secure, non-custodial W5 Pamelo Account. Your funds remain yours.",
              },
              {
                step: "02",
                title: "Authorize",
                desc: "Set a 7-day session key and Max Loss safeguard. Grant restricted access.",
              },
              {
                step: "03",
                title: "Harvest",
                desc: "Our engine captures basis yield on $DOGS/$NOT pairs. 20% performance fee.",
              },
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500">
                <p className="text-4xl font-black italic text-[#E2FF00]/5 group-hover:text-[#E2FF00]/10 transition-colors mb-6">
                  {item.step}
                </p>
                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter mb-4">
                  {item.title}
                </h3>
                <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Vision CTA */}
      <section className="py-48 px-6 border-t border-white/5 text-center">
        <h2 className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-[0.5em] mb-8">
          The Watchman System
        </h2>
        <h3 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter leading-tight mb-8">
          Institutional-Grade
          <br />
          Automation Architecture
        </h3>
        <p className="max-w-md mx-auto text-xs text-white/30 font-medium uppercase tracking-[0.2em] leading-relaxed mb-12">
          A self-hosted, high-availability n8n instance acts as the protocol's decentralized "keep-alive" bot, managing delta drift and deleverage protection 24/7.
        </p>
        <Link
          href="/whitepaper"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors"
        >
          Read Whitepaper v2.0
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Clean Footer */}
      <footer className="py-24 border-t border-white/5 text-center px-6">
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="text-xl">🍈</div>
          <span className="font-bold text-base tracking-tight lowercase">
            pamelo.finance
          </span>
        </div>
        <p className="text-[9px] font-medium text-white/10 uppercase tracking-[0.4em]">
          © 2026 Institutional Grade Basis Yield • Built for TON
        </p>
      </footer>
    </div>
  );
}
