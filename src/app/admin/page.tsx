"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import WorkerHealthPanel from "@/components/admin/WorkerHealthPanel";
import PnLChart from "@/components/admin/PnLChart";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import OTPModal from "@/components/admin/OTPModal";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check for the client-side session flag
    const sessionActive = Cookies.get("admin_session_active");
    if (sessionActive === "true") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Only fetch if authenticated
  const { data: pnlData } = useSWR(isAuthenticated ? '/api/admin/pnl?range=30d' : null, fetcher);
  const { data: workerData } = useSWR(isAuthenticated ? '/api/admin/workers' : null, fetcher, { refreshInterval: 10000 });

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isCheckingAuth) {
      return (
          <div className="min-h-screen bg-[#020617] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#E2FF00] animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-8 space-y-6 pb-24 relative">
        {/* Auth Guard */}
        {!isAuthenticated && <OTPModal onSuccess={handleAuthSuccess} />}

        {/* Header - Always visible but blurred if not auth */}
        <div className={`transition-all duration-500 ${!isAuthenticated ? 'blur-xl pointer-events-none opacity-50' : ''}`}>
            <div className="flex items-center justify-between px-1 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                        Mission Control
                    </h1>
                    <p className="text-xs text-[#E2FF00] font-bold uppercase tracking-[0.2em]">
                        System Analytics & Observability
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <a href="/dashboard" className="text-xs font-bold text-white/30 hover:text-white uppercase tracking-widest transition-colors">
                        ← Back to App
                    </a>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Link href="/admin/logs" className="group bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-colors rounded-xl p-4 flex items-center justify-between">
                    <div>
                         <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Global Stream</p>
                         <p className="text-lg font-black text-white italic uppercase tracking-tighter group-hover:text-[#E2FF00] transition-colors">View System Logs</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg text-white/30 group-hover:text-white transition-colors">→</div>
                </Link>
                <Link href="/admin/wallets" className="group bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-colors rounded-xl p-4 flex items-center justify-between">
                    <div>
                         <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Participants</p>
                         <p className="text-lg font-black text-white italic uppercase tracking-tighter group-hover:text-[#E2FF00] transition-colors">View Wallet Directory</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg text-white/30 group-hover:text-white transition-colors">→</div>
                </Link>
            </div>

            {/* Content Area - Handles loading state or data display */}
            {(!pnlData || !pnlData.summary || !workerData) ? (
                 <div className="min-h-[400px] flex items-center justify-center">
                    {isAuthenticated && <Loader2 className="w-8 h-8 text-[#E2FF00] animate-spin" />}
                    {pnlData?.error && <p className="ml-2 text-red-500 text-xs">{pnlData.error}</p>}
                 </div>
            ) : (
                <>
                    {/* 1. System Health */}
                    <WorkerHealthPanel workers={workerData.workers || []} />

                    {/* 2. Key Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        <StatsCard label="Net Profit (30d)" value={`$${pnlData.summary.netProfit.toFixed(2)}`} trend="+12%" />
                        <StatsCard label="Fees Paid" value={`$${pnlData.summary.totalFees.toFixed(2)}`} subValue="Gas + Protocol" />
                        <StatsCard label="Total Trades" value={pnlData.summary.tradeCount} />
                        <StatsCard label="Active Strategies" value="2" highlight />
                    </div>

                    {/* 3. Main Chart Area */}
                    <div className="grid grid-cols-1 gap-6 mt-6">
                        <div className="w-full">
                            <PnLChart data={pnlData.chartData || []} />
                        </div>
                    </div>
                </>
            )}
        </div>
    </div>
  );
}

function StatsCard({ label, value, subValue, trend, highlight }: any) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
            {highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-[#E2FF00]/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />}
            
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">
                {label}
            </p>
            <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white italic tracking-tighter leading-none">
                    {value}
                </p>
                {trend && (
                    <span className="text-[10px] font-bold text-emerald-500 mb-0.5">
                        {trend}
                    </span>
                )}
            </div>
            {subValue && (
                <p className="text-[9px] font-mono text-white/20 mt-1">
                    {subValue}
                </p>
            )}
        </div>
    )
}
