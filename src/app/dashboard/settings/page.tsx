"use client";

import { useState } from "react";
import { 
  Bell, 
  Shield, 
  Wallet, 
  ChevronRight, 
  LogOut,
  Moon,
  Smartphone
} from "lucide-react";
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import clsx from "clsx";

export default function SettingsPage() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  
  const [notifications, setNotifications] = useState({
    positionUpdates: true,
    riskAlerts: true,
    dailySummary: false
  });

  const toggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
          App Settings
        </h1>
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">
          Preferences & Connection
        </p>
      </div>

      {/* Wallet Connection Status */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">
          Wallet Connection
        </h2>
        {wallet ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                     <Wallet className="w-6 h-6" />
                 </div>
                 <div>
                     <div className="flex items-center gap-2">
                         <h3 className="text-base font-bold text-white uppercase italic tracking-tighter">
                             Connected
                         </h3>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                     </div>
                     <p className="text-[10px] text-white/30 font-mono mt-0.5">
                         {wallet.account.address.slice(0, 4)}...{wallet.account.address.slice(-4)}
                     </p>
                 </div>
             </div>
             
             <button
               onClick={handleDisconnect}
               className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 flex items-center justify-center gap-2 group"
             >
               Disconnect Wallet <LogOut className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
             </button>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  No Wallet Connected
              </p>
          </div>
        )}
      </section>

      {/* Notification Settings */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">
          Notifications
        </h2>
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {[
                { id: 'positionUpdates', label: 'Position Updates', desc: 'Trade entries & exits' },
                { id: 'riskAlerts', label: 'Risk Alerts', desc: 'Margin warnings & liquidation risk' },
                { id: 'dailySummary', label: 'Daily Summary', desc: '24h performance report' }
            ].map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-white/20" />
                        <div>
                            <p className="text-sm font-bold text-white uppercase italic tracking-tight">{item.label}</p>
                            <p className="text-[9px] text-white/30 font-medium">{item.desc}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => toggle(item.id as any)}
                        className={clsx(
                            "w-10 h-5 rounded-full relative transition-colors duration-300",
                            notifications[item.id as keyof typeof notifications] ? "bg-[#E2FF00]" : "bg-white/10"
                        )}
                    >
                        <div className={clsx(
                            "absolute top-1 w-3 h-3 rounded-full bg-[#020617] transition-transform duration-300",
                            notifications[item.id as keyof typeof notifications] ? "left-6" : "left-1"
                        )} />
                    </button>
                </div>
            ))}
        </div>
      </section>

      {/* App Info */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">
            System
        </h2>
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-1 overflow-hidden">
             <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] rounded-xl transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-white/20" />
                      <span className="text-sm font-bold text-white uppercase italic tracking-tight">Security & Terms</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
             </div>
             <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] rounded-xl transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-white/20" />
                      <span className="text-sm font-bold text-white uppercase italic tracking-tight">App Version</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/30">v0.9.4-beta</span>
             </div>
        </div>
      </section>

      <div className="pt-8 text-center">
            <p className="text-[9px] text-white/10 font-black uppercase tracking-[0.3em]">
                Excellence in Execution
            </p>
            <p className="text-[8px] text-white/5 font-mono mt-2">
                User ID: {wallet ? wallet.account.address.slice(0,8) : 'ANON'}
            </p>
      </div>
    </div>
  );
}
