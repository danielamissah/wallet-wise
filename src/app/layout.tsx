// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WalletWise",
  description: "Track your income, expenses, and savings goals — smartly.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WalletWise",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "WalletWise",
    description: "Track your income, expenses, and savings goals — smartly.",
    siteName: "WalletWise",
  },
  icons: {
    shortcut: "/favicon.ico",
    apple: "/icon-180x180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en">
        <body className={inter.className}>
          {children}
          <ServiceWorkerRegistration />
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}