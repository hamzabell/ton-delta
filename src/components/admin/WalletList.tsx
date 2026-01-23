/* eslint-disable */
"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Loader2, ExternalLink, Eye, History } from 'lucide-react';
import Link from 'next/link';
import WalletDetailModal from './WalletDetailModal';

export default function WalletList() {
    const { data, isLoading } = useSWR('/api/admin/wallets', fetcher);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

    return (
        <>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Active Wallets Directory
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr>
                                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Address</th>
                                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Positions</th>
                                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Total Equity</th>
                                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Last Active</th>
                                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 text-[#E2FF00] animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : data?.wallets?.map((wallet: any) => (
                                <tr key={wallet.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                            <span className="text-xs font-mono text-white/70">
                                                {wallet.walletAddress}
                                            </span>
                                        </div>
                                        {wallet.username && (
                                            <span className="text-[9px] text-white/30 pl-4 block">@{wallet.username}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-white">
                                            {wallet.activeCount}
                                        </span>
                                        <span className="text-[10px] text-white/30 ml-1">
                                            / {wallet.totalPositions}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-white/70">
                                        ${wallet.totalEquity?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="p-4 text-xs font-mono text-white/40">
                                        {wallet.lastActive}
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <Link 
                                            href={`/admin/logs?wallet=${wallet.walletAddress}`}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#E2FF00] transition-colors"
                                            title="View Trade Logs"
                                        >
                                            <History className="w-3 h-3" />
                                        </Link>
                                        <button 
                                            onClick={() => setSelectedWallet(wallet.walletAddress)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-[#E2FF00] uppercase tracking-wide transition-colors"
                                        >
                                            Inspect <Eye className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data?.wallets?.length === 0 && (
                        <div className="p-8 text-center text-xs text-white/30 italic">
                            No active wallets found.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedWallet && (
                <WalletDetailModal 
                    address={selectedWallet} 
                    onClose={() => setSelectedWallet(null)} 
                />
            )}
        </>
    );
}
