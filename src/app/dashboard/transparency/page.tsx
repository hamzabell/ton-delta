"use client";

import { useState, useEffect } from "react";
import { Shield, Activity, DollarSign, Wallet } from "lucide-react";
import OTPModal from "@/components/OTPModal";

type Tab = 'logs' | 'health' | 'pnl' | 'wallets';

export default function TransparencyDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('logs');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        switch (activeTab) {
          case 'logs':
            const logsRes = await fetch('/api/admin/audit-logs?limit=100');
            const logsData = await logsRes.json();
            setAuditLogs(logsData.logs || []);
            break;
          case 'health':
            const healthRes = await fetch('/api/admin/system-health');
            const healthData = await healthRes.json();
            setSystemHealth(healthData);
            break;
          case 'pnl':
            const pnlRes = await fetch('/api/admin/pnl');
            const pnlResData = await pnlRes.json();
            setPnlData(pnlResData);
            break;
          case 'wallets':
            const walletsRes = await fetch('/api/admin/wallets');
            const walletsData = await walletsRes.json();
            setWallets(walletsData.wallets || []);
            break;
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, activeTab]);

  if (!isAuthenticated) {
    return <OTPModal onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Transparency Dashboard
          </h1>
          <p className="text-white/40 text-sm mt-2">
            System audit logs, health metrics, and monitoring
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'logs' as Tab, label: 'Audit Logs', icon: Activity },
            { id: 'health' as Tab, label: 'System Health', icon: Shield },
            { id: 'pnl' as Tab, label: 'PnL Tracking', icon: DollarSign },
            { id: 'wallets' as Tab, label: 'Wallet Monitor', icon: Wallet },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[#E2FF00] text-black font-bold'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          {isLoading ? (
            <div className="text-center py-12 text-white/40">Loading...</div>
          ) : (
            <>
              {activeTab === 'logs' && (
                <div className="space-y-2">
                  <h2 className="text-lg font-bold mb-4">Recent Audit Logs</h2>
                  {auditLogs.length === 0 ? (
                    <p className="text-white/40 text-center py-8">No logs found</p>
                  ) : (
                    auditLogs.map(log => (
                      <div
                        key={log.id}
                        className="p-4 bg-white/5 rounded-lg border border-white/5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                log.level === 'ERROR' ? 'bg-red-500/20 text-red-500' :
                                log.level === 'WARN' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-emerald-500/20 text-emerald-500'
                              }`}>
                                {log.level}
                              </span>
                              <span className="text-xs text-white/40">
                                {log.component}
                              </span>
                            </div>
                            <p className="text-sm font-mono">{log.action}</p>
                            {log.positionId && (
                              <p className="text-xs text-white/40 mt-1">
                                Position: {log.positionId}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-white/40">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'health' && systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                      Active Positions
                    </p>
                    <p className="text-2xl font-black">{systemHealth.activePositions}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                      Total TVL
                    </p>
                    <p className="text-2xl font-black">
                      {systemHealth.totalTVL.toFixed(2)} TON
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                      Errors (24h)
                    </p>
                    <p className="text-2xl font-black text-red-500">
                      {systemHealth.recentErrors24h}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                      Worker Success Rate
                    </p>
                    <p className="text-2xl font-black text-emerald-500">
                      {systemHealth.workerHealth.successRate}%
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'pnl' && pnlData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                        Total Gross Profit
                      </p>
                      <p className="text-2xl font-black text-emerald-500">
                        {pnlData.summary.totalGrossProfit.toFixed(2)} TON
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                        Performance Fees (20%)
                      </p>
                      <p className="text-2xl font-black text-[#E2FF00]">
                        {pnlData.summary.performanceFees.toFixed(2)} TON
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                        User Profits
                      </p>
                      <p className="text-2xl font-black">
                        {pnlData.summary.userProfits.toFixed(2)} TON
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wallets' && (
                <div className="space-y-2">
                  <h2 className="text-lg font-bold mb-4">Wallet Monitor</h2>
                  {wallets.length === 0 ? (
                    <p className="text-white/40 text-center py-8">No wallets found</p>
                  ) : (
                    wallets.map(wallet => (
                      <div
                        key={wallet.positionId}
                        className="p-4 bg-white/5 rounded-lg border border-white/5"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-white/40 mb-1">Status</p>
                            <p className="text-sm font-bold uppercase">{wallet.status}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-1">Equity</p>
                            <p className="text-sm font-bold">{wallet.totalEquity.toFixed(2)} TON</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-white/40 mb-1">Vault Address</p>
                            <p className="text-xs font-mono break-all">{wallet.vaultAddress}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
