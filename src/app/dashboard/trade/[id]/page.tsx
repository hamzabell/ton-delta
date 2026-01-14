"use client";

import { useState } from "react";
import { ArrowLeft, TrendingUp, ShieldCheck, Activity, Info, Calendar, Search, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { useTonWallet } from "@tonconnect/ui-react";
import clsx from "clsx";

// Mock data - in production, fetch based on params.id
const PAIR_DATA: Record<string, any> = {
  "ton-usdt": {
    base: "TON",
    quote: "USDT",
    name: "Toncoin",
    fundingRate: "+0.0425%",
    annualizedYield: "42.5%",
    tvl: "$12.4M",
    direction: "Regular",
    description: "TON/USDT is showing consistent positive funding rates, making it ideal for regular basis trading. Long spot TON while shorting TON/USDT perpetuals to capture funding payments.",
  },
  "ton-btc": {
    base: "TON",
    quote: "BTC",
    name: "Toncoin",
    fundingRate: "+0.0380%",
    annualizedYield: "38.0%",
    tvl: "$8.2M",
    direction: "Regular",
    description: "TON/BTC pair offers stable funding rates with BTC-denominated returns. Ideal for users who want exposure to BTC while earning TON funding yield.",
  },
  "ton-eth": {
    base: "TON",
    quote: "ETH",
    name: "Toncoin",
    fundingRate: "+0.0395%",
    annualizedYield: "39.5%",
    tvl: "$6.8M",
    direction: "Regular",
    description: "TON/ETH provides diversified exposure with ETH-denominated returns while capturing TON funding arbitrage opportunities.",
  },
  "not-usdt": {
    base: "NOT",
    quote: "USDT",
    name: "Notcoin",
    fundingRate: "+0.1428%",
    annualizedYield: "142.8%",
    tvl: "$4.1M",
    direction: "Regular",
    description: "Extremely high funding rates driven by strong perpetual demand. High volatility requires careful position sizing.",
  }
};

const TIME_FRAMES = ["7D", "30D", "90D"];

const generateMockData = (days: number) => {
  return Array.from({ length: days }).map((_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    apr: 30 + Math.random() * 40,
  }));
};

export default function TradePage() {
  const params = useParams();
  const wallet = useTonWallet();
  const pairId = (params.id as string) || "ton-usdt";
  const data = PAIR_DATA[pairId] || PAIR_DATA["ton-usdt"];

  // Trading State
  const [amount, setAmount] = useState([0]);
  const [mode, setMode] = useState<"invest" | "redeem">("invest");
  const [aprStability, setAprStability] = useState([50]);
  const [stopLoss, setStopLoss] = useState([5]);
  const [direction, setDirection] = useState<"regular" | "reverse">("regular");
  const [isConfirming, setIsConfirming] = useState(false);
  const maxBalance = 1000; // Mock balance

  // Chart State
  const [timeFrame, setTimeFrame] = useState("30D");
  const [chartData, setChartData] = useState(generateMockData(30));

  const handleTimeFrameChange = (tf: string) => {
    setTimeFrame(tf);
    const days = tf === "7D" ? 7 : tf === "30D" ? 30 : 90;
    setChartData(generateMockData(days));
  };

  // Pair Selector State
  const [showPairSheet, setShowPairSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const PAIRS = [
    { id: "ton-usdt", label: "TON / USDT", base: "TON", quote: "USDT", icon: "T" },
    { id: "ton-btc", label: "TON / BTC", base: "TON", quote: "BTC", icon: "T" },
    { id: "ton-eth", label: "TON / ETH", base: "TON", quote: "ETH", icon: "T" },
    { id: "not-usdt", label: "NOT / USDT", base: "NOT", quote: "USDT", icon: "N" },
  ];

  const filteredPairs = PAIRS.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.quote.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectPair = (id: string) => {
    setShowPairSheet(false);
    setSearchQuery("");
    window.location.href = `/dashboard/trade/${id}`;
  };

  // Mock Position State
  const [myPosition, setMyPosition] = useState(0);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
        if (mode === 'invest') {
            setMyPosition(prev => prev + amount[0]);
        } else {
            setMyPosition(prev => Math.max(0, prev - amount[0]));
        }
        setIsConfirming(false);
        setAmount([0]);
    }, 1500);
  };

  return (
    <div className="pt-2 pb-24 space-y-6">
      
      {/* Header with Dropdown */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors">
           <ArrowLeft className="w-5 h-5" />
        </Link>
        <button 
          onClick={() => setShowPairSheet(true)}
          className="flex-1 flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all text-left"
        >
            <div>
                <h1 className="text-xl font-bold text-white">{data.base} / {data.quote}</h1>
                <p className="text-[10px] text-slate-500 uppercase font-black">Change Pair</p>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Current Opportunity Card */}
      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
           {/* Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-800/50 overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">8hr Funding Rate</p>
                    <p className="text-xl font-black text-emerald-400 break-all">{data.fundingRate}</p>
                </div>
               <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-800/50">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Live APR</p>
                   <p className="text-3xl font-black text-white">{data.annualizedYield}</p>
               </div>
               <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-800/50">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Available TVL</p>
                   <p className="text-2xl font-black text-white">{data.tvl}</p>
               </div>
               <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-800/50">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Basis Type</p>
                   <div className={cn(
                       "inline-flex px-3 py-1.5 rounded-lg text-xs font-black uppercase",
                       data.direction === "Regular" 
                           ? "bg-emerald-500/20 text-emerald-400"
                           : "bg-red-500/20 text-red-400"
                   )}>
                       {data.direction}
                   </div>
               </div>
           </div>
           
           <div className="h-px bg-slate-800 w-full" />

            <p className="text-sm text-slate-400 leading-relaxed">
                {data.description}
            </p>
       </div>

       {/* Timeframe Selector & Chart */}
       <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Historical Yield
              </h3>
              <div className="flex bg-slate-900 shadow-inner p-1 rounded-xl border border-slate-800 w-fit">
                {TIME_FRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => handleTimeFrameChange(tf)}
                    className={clsx(
                      "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                      timeFrame === tf ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
          </div>

          <div className="h-40 w-full relative mt-4">
              {/* Y-Axis Labels */}
              <div className="absolute inset-y-0 right-0 flex flex-col justify-between text-[8px] font-black text-slate-600 uppercase pointer-events-none h-full py-1">
                <span>80%</span>
                <span>60%</span>
                <span>40%</span>
                <span>20%</span>
                <span className="translate-y-1">0%</span>
              </div>

              <div className="h-full mr-10 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradientTrade" x1="0" y1="0" x2="0" y2="1">
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

                    <path
                      d={`M 0 100 ${chartData
                        .map((d, i) => {
                          const x = (i / (chartData.length - 1)) * 100;
                          const y = 80 - ((d.apr - 20) / 60) * 80;
                          return `L ${x} ${y}`;
                        })
                        .join(" ")} L 100 100 Z`}
                      fill="url(#chartGradientTrade)"
                    />
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
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
              </div>
          </div>

          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mr-10 mt-2">
            <span>{chartData[0].date}</span>
            <span>Today</span>
          </div>
       </div>

       {/* Detailed Breakdown */}
       <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                    <Info className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white">APY Calculation</h3>
            </div>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">8hr Rate</span>
                    <span className="text-sm font-black text-emerald-400">{data.fundingRate}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Compounding</span>
                    <span className="text-sm font-black text-white">3x Daily</span>
                </div>
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50 text-center">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Effective APY</p>
                    <p className="text-xl font-black text-white">{data.annualizedYield}</p>
                </div>
            </div>
       </div>

     {/* My Position Card (Appears if invested) */}
     {myPosition > 0 && (
         <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between animate-in slide-in-from-bottom duration-500">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-500 rounded-lg text-slate-950">
                     <TrendingUp className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Position</p>
                     <p className="text-xl font-black text-white">${myPosition.toFixed(2)}</p>
                 </div>
             </div>
             <div className="text-right">
                 <div className="text-xs font-bold text-slate-500 uppercase">Funding Earned</div>
                 <div className="text-emerald-400 font-bold">+$0.00</div>
             </div>
         </div>
     )}
      
      {/* Trading Interface */}
      <div className="space-y-6">
          {/* Only show toggle if user has a position */}
          {myPosition > 0 && (
              <div className="bg-[#0B1221] p-1 rounded-2xl flex border border-slate-800/50">
                  <button 
                    onClick={() => setMode("invest")}
                    className={clsx("flex-1 py-3.5 rounded-xl text-sm font-bold transition-all", mode === "invest" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-white")}
                  >
                      Add More
                  </button>
                  <button 
                    onClick={() => setMode("redeem")}
                    className={clsx("flex-1 py-3.5 rounded-xl text-sm font-bold transition-all", mode === "redeem" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-white")}
                  >
                      Redeem
                  </button>
              </div>
          )}

          <div className="bg-[#0B1221] border border-slate-800/50 rounded-3xl p-8 space-y-6">
               <div className="text-center">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                      Amount to {myPosition === 0 ? "Deploy" : mode === "invest" ? "Add" : "Redeem"}
                  </p>
                   <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl text-slate-600 font-light">$</span>
                      <input 
                        type="number" 
                        value={amount[0]}
                        onChange={(e) => setAmount([parseFloat(e.target.value) || 0])}
                        className="bg-transparent text-4xl font-bold text-white text-center w-40 focus:outline-none placeholder-slate-700"
                        placeholder="0"
                      />
                  </div>
               </div>

               {/* Configuration (Only for Invest mode) */}
               {mode === 'invest' && (
                   <div className="space-y-4 pb-4 border-b border-slate-800/50">
                       <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Basis Direction</label>
                           <div className="grid grid-cols-2 gap-2">
                               <button 
                                   onClick={() => setDirection("regular")}
                                   className={clsx(
                                       "p-3 rounded-xl border text-left transition-all",
                                       direction === "regular" 
                                           ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                           : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                                   )}
                               >
                                   <div className="text-xs font-black uppercase mb-1">Regular Basis</div>
                                   <div className="text-[10px] leading-tight opacity-80">Long Spot + Short Perp</div>
                               </button>
                               <button 
                                   onClick={() => setDirection("reverse")}
                                   className={clsx(
                                       "p-3 rounded-xl border text-left transition-all",
                                       direction === "reverse" 
                                           ? "bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                                           : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                                   )}
                               >
                                   <div className="text-xs font-black uppercase mb-1">Reverse Basis</div>
                                   <div className="text-[10px] leading-tight opacity-80">Short Spot + Long Perp</div>
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               <Slider value={amount} onValueChange={setAmount} max={mode === 'invest' ? maxBalance : myPosition} step={10} className="py-4" />

               {/* APR Stability */}
               {mode === 'invest' && (
                   <div className="space-y-3 pt-4 border-t border-slate-800/50">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> APR Stability
                            </label>
                            <span className={clsx(
                                "text-xs font-black uppercase",
                                aprStability[0] < 30 ? "text-emerald-400" : aprStability[0] > 70 ? "text-amber-400" : "text-blue-400"
                            )}>
                                {aprStability[0] < 30 ? "Conservative" : aprStability[0] > 70 ? "Aggressive" : "Balanced"}
                            </span>
                        </div>
                        <Slider 
                            value={aprStability} 
                            onValueChange={setAprStability} 
                            max={100} 
                            step={10} 
                            className="py-2"
                        />
                         <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                             <span>Stable Yield</span>
                             <span>Max APR</span>
                         </div>
                    </div>
                )}

                {/* Stop Loss Configuration */}
                {mode === 'invest' && (
                    <div className="space-y-3 pt-4 border-t border-slate-800/50">
                         <div className="flex justify-between items-center">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                Stop Loss (%)
                             </label>
                             <span className="text-xs font-black uppercase text-red-400">
                                 {stopLoss[0]}%
                             </span>
                         </div>
                         <Slider 
                             value={stopLoss} 
                             onValueChange={setStopLoss} 
                             max={20} 
                             min={1}
                             step={1} 
                             className="py-2"
                         />
                         <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                             <span>Tight</span>
                             <span>Loose</span>
                         </div>
                    </div>
                )}


               <div className="flex justify-between items-center text-xs font-bold px-2 py-4 border-t border-slate-800/50 mt-4">
                   <span className="text-slate-500">Est. Daily Yield</span>
                   <span className="text-emerald-400">
                      +${((amount[0] * parseFloat(data.annualizedYield.replace('%', '')) * 1) / 365 / 100).toFixed(2)}
                   </span>
               </div>

               <div className="flex justify-between items-center text-xs font-bold px-2 pb-4">
                   <span className="text-slate-500">Network Fee</span>
                   <span className="text-slate-400">~0.05 TON</span>
               </div>

               <button 
                 onClick={handleConfirm}
                 disabled={isConfirming || (mode === 'redeem' && amount[0] > myPosition)}
                 className={clsx(
                     "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95",
                     isConfirming ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                 )}
               >
                   {isConfirming ? "Processing..." : `${myPosition === 0 ? 'Deploy Position' : mode === 'invest' ? 'Add to Position' : 'Redeem'} ($${amount[0]})`}
               </button>
          </div>
      </div>


      {/* Bottom Sheet for Pair Selection */}
      {showPairSheet && (
          <>
              {/* Backdrop */}
              <div 
                  className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in duration-200"
                  onClick={() => setShowPairSheet(false)}
              />
              
              {/* Bottom Sheet */}
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
                                  pairId === pair.id
                                      ? "bg-blue-500/10 border-2 border-blue-500"
                                      : "bg-slate-900/50 border-2 border-transparent hover:bg-slate-800"
                              )}
                          >
                              <div className={clsx(
                                  "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl",
                                  pairId === pair.id
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-slate-800 text-slate-400"
                              )}>
                                  {pair.icon}
                              </div>
                              <div className="flex-1 text-left">
                                  <p className="font-bold text-white">{pair.label}</p>
                                  <p className="text-xs text-slate-500">{pair.base} / {pair.quote}</p>
                              </div>
                              {pairId === pair.id && (
                                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                  </div>
                              )}
                          </button>
                      ))}
                      {filteredPairs.length === 0 && (
                          <div className="text-center py-12">
                              <p className="text-slate-500">No pairs found</p>
                          </div>
                      )}
                  </div>
              </div>
          </>
      )}
    </div>
  );
}
