"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PnLChartProps {
  data: { date: string, profit: number }[];
}

export default function PnLChart({ data }: PnLChartProps) {
  return (
    <div className="h-[300px] w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
            Net Profit (Daily)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `$${val}`}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
