// src/components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard, ArrowLeftRight, Target,
  PieChart, Settings, Wallet, Sun, Moon,
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
  const { theme, toggle } = useTheme();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col shrink-0 transition-colors duration-300">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            WalletWise
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <motion.div key={href} whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4 shrink-0",
                    active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                  )} />
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

        {/* Bottom — user, bell, theme toggle */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <UserButton />
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">Account</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 py-3 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">WalletWise</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationBell />
          <UserButton />
        </div>
      </div>

      {/* ── Mobile bottom tabs ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex items-center justify-around px-2 py-2 transition-colors duration-300">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative",
                active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobileIndicator"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-900/40 rounded-xl"
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