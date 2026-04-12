// src/app/dashboard/layout.tsx
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
        {/*
          pt-16 = space for mobile fixed top bar (64px)
          pb-24 = space for mobile bottom tab bar (96px) — extra for safe area on iPhone
          md:pt-8 md:pb-8 = normal padding on desktop where sidebar handles nav
        */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pt-8 md:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}