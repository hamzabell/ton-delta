"use client";

import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Zap, Activity } from "lucide-react";
import Mermaid from "@/components/Mermaid";

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

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#E2FF00]/20">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-xl">🍈</div>
            <span className="font-bold text-lg tracking-tight lowercase">
              Pamelo.finance
            </span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </nav>

      <article className="pt-32 px-6 max-w-3xl mx-auto">
        <header className="mb-20 text-left md:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E2FF00]/10 border border-[#E2FF00]/20 mb-8">
            <FileText className="w-3 h-3 text-[#E2FF00]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E2FF00]">
              Whitepaper | January 2026
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none mb-6">
            Institutional-Grade
            <br />
            Basis Trading for TON
          </h1>
          <div className="h-1 w-20 bg-[#E2FF00] md:mx-auto"></div>
        </header>

        <section className="space-y-12">
          {/* Section 1 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#E2FF00]">
              1. Executive Summary
            </h2>
            <p className="text-white/60 leading-relaxed">
              The TON ecosystem has successfully onboarded over 900 million users through the Telegram Mini-App (TMA) infrastructure. However, the current retail environment is dominated by high-volatility "meme" assets (e.g., $DOGS, $NOT, $REDO) that often lead to significant capital erosion for non-professional traders.
            </p>
            <p className="text-white/60 leading-relaxed">
              <strong className="text-white">Pamelo.finance</strong> serves as an "Institutional Refiner." We bridge the gap between high-risk retail speculation and stable wealth generation. By leveraging <strong className="text-white">TON W5 Account Abstraction</strong> and automated delta-neutral strategies, Pamelo allows users to harvest "Funding Rates" from speculators while maintaining zero exposure to asset price crashes.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#E2FF00]">
              2. The Strategy: Automated Basis Trading
            </h2>
            <p className="text-white/60 leading-relaxed">
              The core of Pamelo is the <strong className="text-white">Cash & Carry</strong> strategy, a staple of institutional hedge funds, now automated for the average Telegram user.
            </p>
            
            <h3 className="text-lg font-bold uppercase tracking-tight text-white border-l-2 border-[#E2FF00] pl-4">
              2.1. The Mechanics
            </h3>
            <p className="text-white/60 leading-relaxed">
              The protocol captures the <strong className="text-white">Funding Rate</strong>—a periodic fee paid between long and short traders on perpetual futures exchanges to keep the contract price pegged to the spot price. In exuberant bull markets (typical for TON meme coins), long traders pay short traders.
            </p>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/40">Example: Investing 1,000 TON into the $DOGS Strategy</h4>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <span className="text-[#E2FF00] font-black italic">1.</span>
                  <div>
                    <p className="font-bold text-white uppercase italic text-sm mb-1">The Atomic Open</p>
                    <ul className="text-xs text-white/50 space-y-1 list-disc pl-4">
                      <li>Spot Long: (495 TON) is swapped for $DOGS via swap.coffee.</li>
                      <li>Perp Short: (505 TON) is used as collateral on Storm Trade to open a 1x Short position.</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#E2FF00] font-black italic">2.</span>
                  <div>
                    <p className="font-bold text-white uppercase italic text-sm mb-1">The Delta-Neutral State</p>
                    <p className="text-xs text-white/50">Regardless of price action, the net value remains stable. Gains in one leg offset losses in the other.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#E2FF00] font-black italic">3.</span>
                  <div>
                    <p className="font-bold text-white uppercase italic text-sm mb-1">The Harvest</p>
                    <p className="text-xs text-white/50">The user collects the Funding Fee (e.g., every 8 hours) while the principal stays protected.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#E2FF00]">
              3. Technical Architecture: The "Watchman" System
            </h2>
            
            <h3 className="text-lg font-bold uppercase tracking-tight text-white border-l-2 border-[#E2FF00] pl-4">
              3.1. TON W5 Wallet & Session Keys
            </h3>
            <p className="text-white/60 leading-relaxed">
              Pamelo is built on the <strong className="text-white">TON W5 Standard</strong>, solving the "Signature Fatigue" that plagues traditional DeFi. Session Keys allow the backend to execute rebalances without constant user intervention.
            </p>

            <h3 className="text-lg font-bold uppercase tracking-tight text-white border-l-2 border-[#E2FF00] pl-4">
              3.2. Redis-Backed Automation Engine
            </h3>
            <p className="text-white/60 leading-relaxed mb-8">
              A high-availability <strong className="text-white">Redis</strong> task queue within the <strong className="text-white">Next.js</strong> infrastructure acts as the protocol's decentralized "keep-alive" bot, managing rebalances and deleverage protection.
            </p>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <Mermaid chart={WATCHMAN_DIAGRAM} />
              <p className="text-[10px] text-center mt-4 text-white/20 font-bold uppercase tracking-[0.2em]">Fig 1. Next.js + Redis Watchman Logic Flow</p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#E2FF00]">
              4. Safety Architecture & Risk Mitigation
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-[#E2FF00] mb-4" />
                <h4 className="font-black italic uppercase text-sm mb-2">Max Loss Guardrail</h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  Every 60 seconds, the background worker calculates total equity. If it falls below the user-defined Capital Floor, the Emergency Liquidator triggers an instant unwind.
                </p>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <Activity className="w-6 h-6 text-[#E2FF00] mb-4" />
                <h4 className="font-black italic uppercase text-sm mb-2">Stasis Mode</h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  If funding rates turn negative, the vault closes positions and moves funds into liquid staking (e.g., stTON) to earn yield until positive funding returns.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#E2FF00]">
              5. UI/UX Flow: The "Three-Click" Yield
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white/5 rounded-2xl overflow-hidden text-xs">
                <thead className="bg-white/10">
                  <tr>
                    <th className="p-4 uppercase font-black italic">Step</th>
                    <th className="p-4 uppercase font-black italic">UI Action</th>
                    <th className="p-4 uppercase font-black italic">Backend Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["1. Select", "Choose a Meme Vault", "Fetch real-time funding rates"],
                    ["2. Deposit", "Input TON & Max Loss", "Deploy W5 and sign Session Key"],
                    ["3. Refine", "Click 'Start Refining'", "Execute Atomic Open"],
                    ["4. Monitor", "View Live Audit Ledger", "Backend polls and logs rebalances"],
                    ["5. Exit", "Hit 'Panic Button'", "Execute Emergency Unwind"],
                  ].map(([step, ui, backend], i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-bold text-[#E2FF00]">{step}</td>
                      <td className="p-4 text-white/60">{ui}</td>
                      <td className="p-4 text-white/60">{backend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#E2FF00]">
              7. Tokenomics & Business Model
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["Entry/Exit", "0%"],
                ["Management", "0%"],
                ["Success Fee", "20%"],
                ["User Share", "80%"],
              ].map(([label, value], i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-lg font-black text-white italic">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conclusion */}
          <div className="pt-12 border-t border-white/5">
            <p className="text-xl font-black italic text-white uppercase tracking-tighter mb-4">Conclusion</p>
            <p className="text-white/60 leading-relaxed italic">
              Pamelo.finance is the first protocol to turn Telegram’s "Meme Mania" into a sustainable, institutional-grade income stream. By automating complex Basis Trading through the W5 wallet, our Next.js + Redis architecture ensures atomic rebalancing and capital safety in the volatile TON sea.
            </p>
          </div>
        </section>
      </article>

      <footer className="mt-32 py-16 border-t border-white/5 text-center px-6 bg-black/20">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <Link
            href="/dashboard"
            className="bg-[#E2FF00] text-[#020617] px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all mb-12 shadow-[0_20px_40px_rgba(226,255,0,0.1)] flex items-center gap-2"
          >
            Launch App
            <Zap className="w-4 h-4" />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="text-xl">🍈</div>
            <span className="font-bold text-base tracking-tight lowercase">
              pamelo.finance
            </span>
          </div>
          <p className="text-[9px] font-medium text-white/10 uppercase tracking-[0.4em]">
            © 2026 Institutional Grade Basis Yield • Built for TON
          </p>
        </div>
      </footer>
    </div>
  );
}
