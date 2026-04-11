// src/app/dashboard/layout.tsx
// This layout ONLY wraps /dashboard/* pages.
// Next.js applies layouts by folder — this one is scoped to the dashboard.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pt-20 md:pt-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}