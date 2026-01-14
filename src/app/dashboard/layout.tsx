"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Disc, Layers, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TonConnectButton } from "@tonconnect/ui-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard/transparency", icon: Shield },
    { name: "Opportunities", href: "/dashboard", icon: LayoutDashboard },
    { name: "Portfolio", href: "/dashboard/portfolio", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      
      {/* Mobile App Container */}
      <div className="w-full max-w-md bg-slate-950 min-h-screen relative shadow-2xl overflow-hidden flex flex-col border-x border-slate-900/50">
          
          {/* Top Bar */}
          <header className="flex items-center justify-between p-6 sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50">
            <div className="flex items-center gap-2">

                <span className="font-bold tracking-tight">T<span className="text-emerald-500">Δ</span></span>
            </div>
            <TonConnectButton />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6 pb-32 w-full overflow-y-auto no-scrollbar">
            {children}
          </main>

          {/* Floating Bottom Nav - Hidden on Create Page */}
          {pathname !== "/dashboard/strategies/create" && (
          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-3rem)] md:max-w-[360px] z-50">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl shadow-black/50 p-2 flex justify-around items-center ring-1 ring-white/5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className="flex-1">
                        <div className={cn(
                            "flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                            isActive ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
                        )}>
                            {isActive && <div className="absolute inset-0 bg-emerald-500/10 blur-xl"></div>}
                            <item.icon className={cn("w-6 h-6 z-10 transition-transform", isActive && "scale-110")} />
                            <span className="text-[10px] font-medium z-10">{item.name}</span>
                        </div>
                    </Link>
                  )
                })}
            </div>
          </nav>
          )}

      </div>
    </div>
  );
}
