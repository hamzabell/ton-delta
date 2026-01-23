"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Loader2, Wallet, X, AlertTriangle, ExternalLink } from "lucide-react";
import clsx from "clsx";

interface WalletDetailModalProps {
    address: string;
    onClose: () => void;
}

export default function WalletDetailModal({ address, onClose }: WalletDetailModalProps) {
    const { data, isLoading } = useSWR(address ? `/api/admin/wallet/${address}` : null, fetcher);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#020617] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-xl">
                            <Wallet className="w-5 h-5 text-[#E2FF00]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Wallet Inspector</h3>
                            <p className="text-xs text-white/40 font-mono mt-1">{address}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/40 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="w-8 h-8 text-[#E2FF00] animate-spin" />
                            <p className="text-xs text-white/30 uppercase tracking-widest">Loading Wallet Data...</p>
                        </div>
                    ) : !data || data.error ? (
                         <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
                            <AlertTriangle className="w-10 h-10 text-red-500/50" />
                            <p className="text-red-500 font-bold uppercase tracking-widest">{data?.error || "Failed to load data"}</p>
                        </div>
                    ) : (
                        <>
                            {/* 1. Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Total Positions</p>
                                    <p className="text-2xl font-black text-white mt-1">{data.positions.length}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">User Database ID</p>
                                    <p className="text-xs font-mono text-white/50 mt-2 truncate" title={data.user.id}>{data.user.id}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Telegram ID</p>
                                    <p className="text-lg font-mono text-white mt-1">{data.user.telegramId || "N/A"}</p>
                                </div>
                            </div>

                            {/* 2. Positions */}
                            <div>
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#E2FF00]" />
                                    Active Strategies
                                </h4>
                                <div className="space-y-2">
                                    {data.positions.length === 0 ? (
                                        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                                            <p className="text-xs text-white/30">No active positions found.</p>
                                        </div>
                                    ) : (
                                        data.positions.map((pos: any) => (
                                            <div key={pos.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx(
                                                        "w-1 h-8 rounded-full",
                                                        pos.status === 'active' ? "bg-emerald-500" : "bg-amber-500"
                                                    )} />
                                                    <div>
                                                        <span className="text-sm font-bold text-white uppercase">{pos.pairId}</span>
                                                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mt-0.5">
                                                            <span>Equity: ${pos.totalEquity}</span>
                                                            <span className="text-white/10">|</span>
                                                            <span>Drift: {pos.driftCoefficient}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={clsx(
                                                    "text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider",
                                                    pos.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                                )}>
                                                    {pos.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* 3. Audit Logs Timeline */}
                            <div>
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#E2FF00]" />
                                    Audit Trail
                                </h4>
                                <div className="relative border-l border-white/10 ml-2 pl-6 space-y-6">
                                    {data.logs.length === 0 ? (
                                         <p className="text-xs text-white/30 italic">No logs recorded.</p>
                                    ) : (
                                        data.logs.map((log: any) => (
                                            <div key={log.id} className="relative">
                                                <div className={clsx(
                                                    "absolute -left-[29px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#020617]",
                                                    log.level === 'WARN' ? "bg-amber-500" : "bg-white/20"
                                                )} />
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-mono text-white/30">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#E2FF00] uppercase">
                                                        {log.action}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/60 font-mono break-all line-clamp-2 hover:line-clamp-none cursor-default transition-all">
                                                    {JSON.stringify(log.details)}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
