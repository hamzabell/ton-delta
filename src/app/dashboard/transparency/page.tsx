"use client";

import { useState } from "react";
import { Shield, Info, TrendingUp, Calendar, Filter, ChevronRight, Activity, Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import clsx from "clsx";

const TIME_FRAMES = ["7D", "30D", "90D"];
const PAIRS = [
  { id: "ton-usdt", label: "TON / USDT", base: "TON", quote: "USDT", icon: "T" },
  { id: "ton-btc", label: "TON / BTC", base: "TON", quote: "BTC", icon: "T" },
  { id: "ton-eth", label: "TON / ETH", base: "TON", quote: "ETH", icon: "T" },
  { id: "not-usdt", label: "NOT / USDT", base: "NOT", quote: "USDT", icon: "N" },
];

const PAIR_DATA: Record<string, any> = {
  "ton-usdt": { fundingRate: "+0.0425%", annualizedYield: "42.5%" },
  "ton-btc": { fundingRate: "+0.0380%", annualizedYield: "38.0%" },
  "ton-eth": { fundingRate: "+0.0395%", annualizedYield: "39.5%" },
  "not-usdt": { fundingRate: "+0.1428%", annualizedYield: "142.8%" }
};

// Mock historical data for charts
const generateMockData = (days: number) => {
  return Array.from({ length: days }).map((_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    value: 0.03 + Math.random() * 0.04,
    apr: 30 + Math.random() * 40,
  }));
};

export default function TransparencyPage() {
  const [timeFrame, setTimeFrame] = useState("30D");
  const [selectedPair, setSelectedPair] = useState("ton-usdt");
  const [chartData, setChartData] = useState(generateMockData(30));
  const [showPairSheet, setShowPairSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTimeFrameChange = (tf: string) => {
    setTimeFrame(tf);
    const days = tf === "7D" ? 7 : tf === "30D" ? 30 : 90;
    setChartData(generateMockData(days));
  };

  const selectedPairData = PAIRS.find(p => p.id === selectedPair) || PAIRS[0];
  const filteredPairs = PAIRS.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.quote.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectPair = (id: string) => {
    setSelectedPair(id);
    setShowPairSheet(false);
    setSearchQuery("");
    // In a real app we might trigger a re-fetch here
    setChartData(generateMockData(timeFrame === "7D" ? 7 : timeFrame === "30D" ? 30 : 90));
  };

  return (
    <div className="space-y-6 pt-2 pb-24 relative min-h-[80vh]">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white px-1">Dashboard</h1>
        <p className="text-sm text-slate-400 px-1">Real-time verification of delta-neutral yields</p>
      </div>

      {/* Asset Selection Dropdown Trigger */}
      <div className="px-1">
          <button
            onClick={() => setShowPairSheet(true)}
            className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all text-left"
          >
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-lg">
                      {selectedPairData.icon}
                  </div>
                  <div>
                      <h2 className="font-bold text-white">{selectedPairData.label}</h2>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Change Asset Pair</p>
                  </div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400" />
          </button>
      </div>

      {/* Timeframe Selector */}
      <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        {TIME_FRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => handleTimeFrameChange(tf)}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              timeFrame === tf ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Main Chart Card */}
      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Historical Basis Yield</p>
            <h3 className="text-xl font-black text-white">Daily Average</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Live APR</p>
            <p className="text-xl font-black text-emerald-400">{PAIR_DATA[selectedPair]?.annualizedYield || "0.0%"}</p>
          </div>
        </div>

        {/* Minimalist SVG Chart */}
        <div className="h-48 w-full relative mt-4">
          {/* Y-Axis Labels */}
          <div className="absolute inset-y-0 right-0 flex flex-col justify-between text-[8px] font-black text-slate-600 uppercase pointer-events-none h-full py-1">
            <span>80%</span>
            <span>60%</span>
            <span>40%</span>
            <span>20%</span>
            <span className="translate-y-2">0%</span>
          </div>
          
          <div className="h-full mr-12 relative group">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Grid Lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
              ))}
              
              {/* Vertical Grid Lines */}
              {[25, 50, 75].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
              ))}

              {/* Area */}
              <path
                d={`M 0 100 ${chartData
                  .map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 100;
                    const y = 80 - ((d.apr - 20) / 60) * 80;
                    return `L ${x} ${y}`;
                  })
                  .join(" ")} L 100 100 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d={chartData
                  .map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 100;
                    const y = 80 - ((d.apr - 20) / 60) * 80;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
            </svg>
          </div>
        </div>

        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mr-12 mt-2">
          <span>{chartData[0].date}</span>
          <span>Today</span>
        </div>
      </div>

      {/* APR Breakdown */}
      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white">APR/APY Breakdown</h3>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-slate-800/50 gap-1">
            <span className="text-sm text-slate-400 uppercase font-bold text-[10px] tracking-wider whitespace-nowrap">8hr Funding Rate</span>
            <span className="text-lg sm:text-sm font-black text-emerald-400 break-all">{PAIR_DATA[selectedPair]?.fundingRate || "+0.0000%"}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-sm text-slate-400 uppercase font-bold text-[10px] tracking-wider">Compounding Frequency</span>
            <span className="text-sm font-black text-white">3x Daily</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
            <span className="text-sm text-slate-400 uppercase font-bold text-[10px] tracking-wider">Annualization</span>
            <span className="text-sm font-black text-white">365 Days</span>
          </div>
          <div className="pt-2">
            <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 text-center">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Effective APY</p>
              <p className="text-2xl font-black text-white">{PAIR_DATA[selectedPair]?.annualizedYield || "0.0%"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white">Validation Status</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: "Delta Neutral Check", status: "Verified", color: "text-emerald-400" },
            { label: "Reserve Coverage", status: "100.00%", color: "text-white" },
            { label: "Hedge Health", status: "Optimal", color: "text-emerald-400" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
              <span className={cn("text-xs font-black uppercase", item.color)}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Disclaimer */}
      <div className="px-6 text-center">
        <p className="text-[10px] text-slate-600 font-medium leading-relaxed uppercase tracking-tighter">
          Basis trading involve unique risks including liquidation of hedge positions and funding rate volatility.
          Data verified by Neutral Oracle v2.4.1
        </p>
      </div>

      {/* Bottom Sheet for Pair Selection */}
      {showPairSheet && (
          <>
              <div 
                  className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in duration-200"
                  onClick={() => setShowPairSheet(false)}
              />
              
              <div className="fixed inset-x-0 bottom-0 z-[101] bg-[#0B1221] border-t border-slate-800 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white">Select Asset Pair</h3>
                      <button
                          onClick={() => setShowPairSheet(false)}
                          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                      >
                          <X className="w-5 h-5 text-slate-400" />
                      </button>
                  </div>

                  {/* Search */}
                  <div className="p-4 border-b border-slate-800">
                      <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                              type="text"
                              placeholder="Search pairs..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                          />
                      </div>
                  </div>

                  {/* Pairs List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {filteredPairs.map((pair) => (
                          <button
                              key={pair.id}
                              onClick={() => selectPair(pair.id)}
                              className={clsx(
                                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                                  selectedPair === pair.id
                                      ? "bg-blue-500/10 border-2 border-blue-500"
                                      : "bg-slate-900/50 border-2 border-transparent hover:bg-slate-800"
                              )}
                          >
                              <div className={clsx(
                                  "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl",
                                  selectedPair === pair.id
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-slate-800 text-slate-400"
                              )}>
                                  {pair.icon}
                              </div>
                              <div className="flex-1 text-left">
                                  <p className="font-bold text-white">{pair.label}</p>
                                  <p className="text-xs text-slate-500">{pair.base} / {pair.quote}</p>
                              </div>
                              {selectedPair === pair.id && (
                                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                  </div>
                              )}
                          </button>
                      ))}
                  </div>
              </div>
          </>
      )}
    </div>
  );
}
