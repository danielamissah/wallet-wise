// src/components/dashboard/Sidebar.tsx
//
// "use client" is needed here because we use usePathname() — a hook that reads
// the current URL. Hooks only work in Client Components, not Server Components.
// Rule of thumb: if you use a hook or browser event, add "use client" at the top.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PieChart,
  Settings,
  Wallet,
} from "lucide-react";

// Each nav item maps to a route in /dashboard
const NAV_ITEMS = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Overview"     },
  { href: "/dashboard/transactions", icon: ArrowLeftRight,  label: "Transactions" },
  { href: "/dashboard/budgets",      icon: PieChart,        label: "Budgets"      },
  { href: "/dashboard/goals",        icon: Target,          label: "Goals"        },
  { href: "/dashboard/settings",     icon: Settings,        label: "Settings"     },
];

export default function Sidebar() {
  // usePathname() returns the current URL path e.g. "/dashboard/transactions"
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold text-gray-900">WalletWise</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          // Exact match for /dashboard, prefix match for sub-pages
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-gray-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User button at the bottom — Clerk's pre-built avatar + dropdown */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <span className="text-sm text-gray-500">Account</span>
      </div>

    </aside>
  );
}