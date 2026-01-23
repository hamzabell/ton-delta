"use client";

import { Activity, XCircle, CheckCircle } from "lucide-react";
import clsx from "clsx";

interface Worker {
    name: string;
    status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    successCount: number;
    failureCount: number;
    lastSeen: string | null;
}

interface WorkerHealthPanelProps {
    workers: Worker[];
}

export default function WorkerHealthPanel({ workers }: WorkerHealthPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workers.map((worker) => (
            <div key={worker.name} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <Activity className={clsx(
                            "w-4 h-4",
                            worker.status === 'HEALTHY' ? "text-emerald-500" : 
                            worker.status === 'DEGRADED' ? "text-amber-500" : "text-red-500"
                        )} />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            {worker.name}
                        </h3>
                     </div>
                     <p className="text-[10px] text-white/40 font-mono">
                        Last Active: {worker.lastSeen ? new Date(worker.lastSeen).toLocaleTimeString() : 'NEVER'}
                     </p>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                        <span className="text-xs font-black text-emerald-500">{worker.successCount}</span>
                        <CheckCircle className="w-3 h-3 text-emerald-500/50" />
                    </div>
                    {(worker.failureCount > 0) && (
                         <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs font-black text-red-500">{worker.failureCount}</span>
                            <XCircle className="w-3 h-3 text-red-500/50" />
                        </div>
                    )}
                </div>
            </div>
        ))}
    </div>
  );
}
