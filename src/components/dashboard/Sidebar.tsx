// src/components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PieChart,
  Settings,
  Wallet,
} from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";

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
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 h-screen bg-white border-r border-gray-100 flex-col shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900">WalletWise</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <motion.div
                key={href}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      active ? "text-blue-600" : "text-gray-400"
                    )}
                  />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User + notification bell */}
        <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm text-gray-500 truncate">Account</span>
          </div>
          <NotificationBell />
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">WalletWise</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative",
                active ? "text-blue-600" : "text-gray-400"
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobileIndicator"
                  className="absolute inset-0 bg-blue-50 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0 relative z-10" />
              <span className="text-[10px] font-medium relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}