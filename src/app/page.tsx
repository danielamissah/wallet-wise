// src/app/page.tsx
import Link from "next/link";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

const FEATURES = [
  { icon: "💸", label: "Track income & expenses" },
  { icon: "📊", label: "Charts & analytics" },
  { icon: "🎯", label: "Savings goals" },
  { icon: "🔔", label: "Budget alerts" },
  { icon: "🌍", label: "Multi-currency" },
  { icon: "⚡", label: "Auto-categorization" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💼</span>
          <span className="text-lg font-semibold text-gray-900">WalletWise</span>
        </div>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
              Dashboard →
            </Link>
            <UserButton />
          </div>
        </Show>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span>✨</span> Free forever — no credit card needed
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight max-w-xl">
          Your money,<br />under control.
        </h1>

        <p className="text-gray-500 text-lg max-w-md mb-10">
          WalletWise helps you track every dollar, hit your savings goals, and
          never blow your budget again.
        </p>

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm">
              Get started free →
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm"
          >
            Go to dashboard →
          </Link>
        </Show>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12 max-w-lg">
          {FEATURES.map(f => (
            <div
              key={f.label}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full shadow-sm"
            >
              <span>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100">
        © {new Date().getFullYear()} WalletWise — built with Next.js & ❤️
      </footer>

    </main>
  );
}