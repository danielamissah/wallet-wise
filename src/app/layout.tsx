// src/app/layout.tsx
// This is the ROOT layout — wraps every single page in the app.
// It should ONLY contain things every page needs: ClerkProvider and global CSS.
// The Sidebar belongs in src/app/dashboard/layout.tsx, NOT here.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WalletWise",
  description: "Track your income, expenses, and savings goals — smartly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}