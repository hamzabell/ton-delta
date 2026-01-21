"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TonConnectButton } from "@tonconnect/ui-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Yields", href: "/dashboard", icon: LayoutDashboard },
    { name: "Portfolio", href: "/dashboard/portfolio", icon: Wallet },
    { name: "Audit", href: "/dashboard/transparency", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex justify-center selection:bg-[#E2FF00]/20">
      {/* Subtle Background Grain/Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute top-0 right-0 w-[80%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Mobile App Container */}
      <div className="w-full max-w-md bg-[#020617] min-h-screen relative flex flex-col border-x border-white/5">
        {/* Top Bar - Ultra Clean */}
        <header className="fixed top-0 w-full max-w-md z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍈</span>
            <span className="font-bold tracking-tight text-base">
              pamelo.finance
            </span>
          </div>
          <div className="scale-90 origin-right">
            <TonConnectButton />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-6 pt-24 pb-32 w-full overflow-y-auto no-scrollbar">
          {children}
        </main>

        {/* Minimal Bottom Nav */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200",
                      isActive
                        ? "text-[#E2FF00] bg-white/5"
                        : "text-white/30 hover:text-white/50",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "opacity-100" : "opacity-50",
                      )}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
