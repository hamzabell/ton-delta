"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WalletList from "@/components/admin/WalletList";

export default function WalletsPage() {
    return (
        <div className="min-h-screen bg-[#020617] p-8 space-y-6 pb-24">
             {/* Header */}
             <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">
                        Wallet Directory
                    </h1>
                    <p className="text-xs text-[#E2FF00] font-bold uppercase tracking-[0.2em]">
                        Active Strategy Participants
                    </p>
                </div>
             </div>

             <WalletList />
        </div>
    );
}
