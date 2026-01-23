"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Loader2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import clsx from 'clsx';

interface Log {
    id: string;
    timestamp: string;
    level: string;
    component: string;
    action: string;
    details: any;
    position?: {
        user?: {
            walletAddress: string;
        }
    }
}

export default function ActivityFeed() {
    const [filter, setFilter] = useState<'ALL' | 'PANIC' | 'ERROR'>('ALL');
    const [component, setComponent] = useState<'ALL' | 'Watchman' | 'Risk' | 'Funding' | 'StonFi'>('ALL');
    const [page, setPage] = useState(1);

    const typeParam = filter === 'ALL' ? '' : `&type=${filter}`;
    const compParam = component === 'ALL' ? '' : `&comp=${component}`;
    
    // Add compParam to URL
    const { data, isLoading } = useSWR<{ logs: Log[] }>(`/api/admin/activity?limit=50${typeParam}${compParam}`, fetcher, { refreshInterval: 5000 });

    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[500px]">
             {/* Header */}
             <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Live System Feed
                </h3>
                <div className="flex items-center gap-2">
                    {/* Component Filter */}
                    <select 
                        className="bg-white/5 text-[9px] text-white/50 border border-white/10 rounded-lg px-2 py-1 focus:outline-none uppercase font-bold tracking-wider"
                        value={component}
                        onChange={(e) => setComponent(e.target.value as any)}
                    >
                        <option value="ALL">All Sources</option>
                        <option value="Watchman">Watchman</option>
                        <option value="Risk">Risk Monitor</option>
                        <option value="Funding">Funding</option>
                        <option value="StonFi">Ston.fi</option>
                    </select>

                    <div className="w-px h-3 bg-white/10 mx-1" />

                    {/* Level Filter */}
                    {['ALL', 'PANIC', 'ERROR'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={clsx(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                filter === f 
                                    ? "bg-[#E2FF00] text-black" 
                                    : "bg-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
             </div>

             {/* List */}
             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {isLoading && !data ? (
                     <div className="flex justify-center py-20">
                        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                     </div>
                ) : (
                    data?.logs.map(log => (
                        <div key={log.id} className="p-3 rounded-xl bg-black/20 hover:bg-white/5 transition-colors border border-white/5 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                             <div className={clsx(
                                 "w-8 h-8 rounded-lg flex items-center justify-center",
                                 log.level === 'ERROR' ? "bg-red-500/10 text-red-500" :
                                 log.level === 'WARN' ? "bg-amber-500/10 text-amber-500" :
                                 "bg-blue-500/10 text-blue-500"
                             )}>
                                 {log.action.includes('PANIC') ? <ShieldAlert className="w-4 h-4" /> :
                                  log.level === 'ERROR' ? <AlertTriangle className="w-4 h-4" /> :
                                  <Info className="w-4 h-4" />
                                 }
                             </div>

                             <div className="overflow-hidden">
                                 <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-mono text-white/30">
                                         {new Date(log.timestamp).toLocaleTimeString()}
                                     </span>
                                     <span className="text-xs font-bold text-white truncate">
                                         {log.action}
                                     </span>
                                 </div>
                                 <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/40 uppercase tracking-wider">
                                          {log.component}
                                      </span>
                                      {log.position?.user?.walletAddress && (
                                           <span className="text-[9px] font-mono text-white/30 truncate max-w-[120px]">
                                               {log.position.user.walletAddress}
                                           </span>
                                      )}
                                 </div>
                                 {/* Traceability: Show Max Loss Config if present */}
                                 {log.details && (log.details as any).maxLossConfig && (
                                     <p className="text-[9px] text-amber-500/80 mt-1 font-mono">
                                         Max Loss Triggered: {(log.details as any).currentLoss * 100}% (Limit: {(log.details as any).maxLossConfig * 100}%)
                                     </p>
                                 )}
                             </div>

                             <div className="px-2 py-1 rounded border border-white/5 text-[9px] font-mono text-white/20">
                                 {log.level}
                             </div>
                        </div>
                    ))
                )}
             </div>
        </div>
    );
}
