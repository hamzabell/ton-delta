"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Loader2, ArrowLeft, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";

import { use } from "react";

export default function WalletDetailsPage({ params }: { params: Promise<{ address: string }> }) {
    // Unwrap params in Client Component using use() hook or just direct access if it's passed as prop to page
    // Actually in Next.js 15, page props 'params' is a Promise.
    // But since this is a "use client" component exported as default page, it receives params as prop.
    const { address } = use(params);
    
    const { data, isLoading } = useSWR(address ? `/api/admin/wallet/${address}` : null, fetcher);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#E2FF00] animate-spin" />
            </div>
        );
    }

    if (!data || data.error) {
        return (
            <div className="min-h-screen bg-[#020617] p-8 text-center flex flex-col items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-500 font-bold uppercase tracking-widest text-lg">
                    {data?.error || "Wallet Not Found"}
                </p>
                <div className="bg-white/5 p-4 rounded-lg mt-4 max-w-md">
                    <p className="text-xs text-white/40 font-mono break-all">
                        Requested: {address}
                    </p>
                </div>
                <Link href="/admin/wallets" className="text-[#E2FF00] text-sm mt-8 block hover:underline font-bold uppercase tracking-wide">
                    ← Return to Directory
                </Link>
            </div>
        );
    }

    const { user, positions, logs } = data;

    return (
        <div className="min-h-screen bg-[#020617] p-8 space-y-8 pb-24">
             {/* Header */}
             <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">
                        Wallet Inspector
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Wallet className="w-3 h-3 text-[#E2FF00]" />
                        <span className="text-xs font-mono text-white/50 tracking-wider">
                            {user.walletAddress || "Unknown Address"}
                        </span>
                    </div>
                </div>
             </div>

             {/* 1. Overview Stats */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                     <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total Positions</p>
                     <p className="text-2xl font-black text-white">{positions.length}</p>
                 </div>
                 <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                     <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">User ID</p>
                     <p className="text-xs font-mono text-white/50 mt-1 truncate">{user.id}</p>
                 </div>
                 <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                     <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Telegram ID</p>
                     <p className="text-lg font-mono text-white">{user.telegramId?.toString() || "N/A"}</p>
                 </div>
             </div>

             {/* 2. Active Positions Grid */}
             <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-1">
                    Strategy Positions
                </h3>
                <div className="space-y-3">
                    {positions.map((pos: any) => (
                        <div key={pos.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-2 h-12 rounded-full",
                                    pos.status === 'active' ? "bg-emerald-500" :
                                    pos.status === 'stasis' ? "bg-amber-500" : "bg-white/10"
                                )} />
                                <div>
                                    <h4 className="font-bold text-white uppercase">{pos.pairId}</h4>
                                    <div className="flex items-center gap-2 text-xs text-white/40 font-mono mt-1">
                                        <span>Eq: ${pos.totalEquity}</span>
                                        <span className="text-white/20">|</span>
                                        <span>Drift: {pos.driftCoefficient}</span>
                                        <span className="text-white/20">|</span>
                                        <span>MaxLoss: {pos.maxLossPercentage * 100}%</span>
                                    </div>
                                </div>
                             </div>
                             <div className="text-right">
                                 <span className={clsx(
                                     "text-[10px] mobile-wide-caps font-bold px-2 py-1 rounded",
                                     pos.status === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                                     pos.status === 'stasis' ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-white/30"
                                     
                                 )}>
                                     {pos.status}
                                 </span>
                                 <p className="text-[10px] text-white/20 mt-2 font-mono">
                                     Created: {new Date(pos.createdAt).toLocaleDateString()}
                                 </p>
                             </div>
                        </div>
                    ))}
                    {positions.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-xs text-white/30">No positions found for this wallet.</p>
                        </div>
                    )}
                </div>
             </div>

             {/* 3. Timeline / Audit Logs */}
             <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-1">
                    Activity Timeline
                </h3>
                <div className="space-y-0 relative border-l border-white/10 ml-3 pl-6 pb-4">
                    {logs.map((log: any) => (
                        <div key={log.id} className="mb-6 relative">
                            <div className={clsx(
                                "absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-[#020617]",
                                log.level === 'WARN' || log.action.includes('PANIC') ? "bg-amber-500" : "bg-white/20"
                            )} />
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-white/30">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                                <span className={clsx(
                                    "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                     log.level === 'WARN' ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-white"
                                )}>
                                    {log.action}
                                </span>
                            </div>
                            <p className="text-xs text-white/60">
                                {log.component} • {JSON.stringify(log.details)}
                            </p>
                        </div>
                    ))}
                     {logs.length === 0 && (
                        <p className="text-xs text-white/30 italic">No activity logs recorded.</p>
                    )}
                </div>
             </div>
        </div>
    );
}
