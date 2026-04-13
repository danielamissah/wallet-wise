// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ThemeProvider from "@/components/ThemeProvider";
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
  formatDetection: { telephone: false },
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
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} bg-white dark:bg-gray-950 transition-colors duration-300`}>
          <ThemeProvider>
            {children}
            <ServiceWorkerRegistration />
            <InstallPrompt />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}