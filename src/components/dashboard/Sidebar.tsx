// src/components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ArrowLeftRight, Target, PieChart, Settings, Wallet } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Overview"     },
  { href: "/dashboard/transactions", icon: ArrowLeftRight,  label: "Transactions" },
  { href: "/dashboard/budgets",      icon: PieChart,        label: "Budgets"      },
  { href: "/dashboard/goals",        icon: Target,          label: "Goals"        },
  { href: "/dashboard/settings",     icon: Settings,        label: "Settings"     },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 h-screen bg-white border-r border-gray-100 flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900">WalletWise</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive(href) ? "text-blue-600" : "text-gray-400")} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-gray-500">Account</span>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">WalletWise</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
              isActive(href) ? "text-blue-600" : "text-gray-400"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}