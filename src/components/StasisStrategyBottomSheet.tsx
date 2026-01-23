"use client";

import { X, Check, ShieldCheck, Sprout } from "lucide-react";
import clsx from "clsx";

interface StasisStrategyBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStrategy: "CASH" | "STAKE";
  onSelect: (strategy: "CASH" | "STAKE") => void;
}

export default function StasisStrategyBottomSheet({
  isOpen,
  onClose,
  selectedStrategy,
  onSelect,
}: StasisStrategyBottomSheetProps) {
  if (!isOpen) return null;

  const strategies = [
    {
      id: "CASH",
      name: "Safe Harbor",
      emoji: "⚓️",
      icon: ShieldCheck,
      desc: "Instant retreat to 100% TON Cash. Zero risk, zero fees. Best for short-term market choppiness.",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20"
    },
    {
      id: "STAKE",
      name: &quot;Yield Hunter&quot;,
      emoji: "🌾",
      icon: Sprout,
      desc: "Auto-swap to Liquid Staking (stTON) to earn ~4% APY while waiting. Note: Incurs ~0.6% swap fees.",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20"
    }
  ] as const;

  return (
    <>
      <div
        className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[110] flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="w-full max-w-2xl bg-[#0B1221] rounded-t-3xl shadow-2xl pb-8 border-t border-white/5">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-[#0B1221] z-10 rounded-t-3xl">
            <div className="w-12 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="px-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                 <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">
                  Idle Capital Strategy
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                  What should we do when funding is negative?
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            <div className="space-y-3">
              {strategies.map((strat) => (
                <button
                  key={strat.id}
                  onClick={() => {
                    onSelect(strat.id as "CASH" | "STAKE");
                    onClose();
                  }}
                  className={clsx(
                    "w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group",
                    selectedStrategy === strat.id
                      ? "bg-white/5 border-[#E2FF00] shadow-[0_0_20px_rgba(226,255,0,0.05)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-start gap-4 z-10 relative">
                     <div className={clsx("p-3 rounded-xl flex-shrink-0", strat.bg)}>
                        <strat.icon className={clsx("w-6 h-6", strat.color)} />
                     </div>
                     <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                {strat.name} <span className="text-lg not-italic">{strat.emoji}</span>
                            </span>
                            {selectedStrategy === strat.id && (
                                <div className="w-5 h-5 rounded-full bg-[#E2FF00] flex items-center justify-center">
                                    <Check className="w-3 h-3 text-black stroke-[4]" />
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium pr-4">
                            {strat.desc}
                        </p>
                     </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-[9px] text-orange-200 font-bold uppercase tracking-widest leading-relaxed">
                   ⚠️ &quot;Yield Hunter&quot; aims for ~4% APY but costs ~0.6% in fees per switch. Only use if you expect long bear markets (&gt; 2 weeks).
                </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
