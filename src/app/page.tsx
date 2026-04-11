"use client";

import Link from "next/link";
import { SignInButton, Show } from "@clerk/nextjs";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Wallet, TrendingUp, Shield, Zap, Globe, Bell,
  ArrowRight, Star, ChevronDown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  { icon: TrendingUp, title: "Smart analytics",  desc: "Beautiful charts that show exactly where your money goes each month.",          color: "from-blue-500 to-cyan-400"     },
  { icon: Bell,       title: "Budget alerts",     desc: "Get warned before you overspend. Set limits per category, per month.",          color: "from-violet-500 to-purple-400" },
  { icon: Globe,      title: "Multi-currency",    desc: "Track expenses in any currency. Everything normalises to USD for your charts.", color: "from-emerald-500 to-teal-400"  },
  { icon: Zap,        title: "Auto-categorize",   desc: "Type 'Netflix' and we already know it's entertainment. Zero effort.",           color: "from-amber-500 to-orange-400"  },
  { icon: Shield,     title: "Secure by default", desc: "Your data is protected with enterprise-grade auth powered by Clerk.",           color: "from-rose-500 to-pink-400"     },
  { icon: Wallet,     title: "Savings goals",     desc: "Set a target, track progress, celebrate wins. Your goals, visualised.",         color: "from-indigo-500 to-blue-400"   },
];

const STATS = [
  { value: "100%", label: "Free forever"  },
  { value: "12+",  label: "Currencies"    },
  { value: "∞",    label: "Transactions"  },
  { value: "0",    label: "Hidden fees"   },
];

function Orb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none ${className}`} />;
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-cyan-600/20 rounded-3xl blur-2xl" />
      <div className="relative bg-[#0e1120] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Fake browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          <div className="flex-1 mx-4 h-5 bg-white/5 rounded-lg" />
        </div>
        <div className="p-5 grid grid-cols-3 gap-3">
          {/* Stat cards */}
          {[
            { label: "Income",   value: "$4,200", color: "text-emerald-400", bar: "bg-emerald-500", w: "100%" },
            { label: "Expenses", value: "$2,840", color: "text-rose-400",    bar: "bg-rose-500",    w: "67%"  },
            { label: "Balance",  value: "$1,360", color: "text-blue-400",    bar: "bg-blue-500",    w: "32%"  },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: s.w }}
                  transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${s.bar}`}
                />
              </div>
            </div>
          ))}
          {/* Bar chart */}
          <div className="col-span-2 bg-white/[0.04] rounded-xl p-4 border border-white/5">
            <p className="text-[10px] text-white/30 mb-3">Monthly overview</p>
            <div className="flex items-end gap-1.5 h-16">
              {[65,40,80,55,90,48,72,38,85,60,95,70].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.8 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                  className="flex-1 rounded-t-sm"
                  style={{ background: i % 2 === 0 ? "linear-gradient(to top,#3b82f6,#60a5fa)" : "linear-gradient(to top,#8b5cf6,#a78bfa)" }}
                />
              ))}
            </div>
          </div>
          {/* Donut */}
          <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-white/30 mb-2">By category</p>
            <div className="relative w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#ffffff08" strokeWidth="5" />
                <motion.circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke="url(#g1)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="88"
                  initial={{ strokeDashoffset: 88 }}
                  animate={{ strokeDashoffset: 22 }}
                  transition={{ delay: 1.2, duration: 1.2, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white/60">75%</span>
              </div>
            </div>
          </div>
          {/* Transaction list */}
          <div className="col-span-3 bg-white/[0.04] rounded-xl p-4 border border-white/5">
            <p className="text-[10px] text-white/30 mb-3">Recent transactions</p>
            <div className="space-y-2.5">
              {[
                { name: "Netflix",     cat: "Entertainment", amount: "-$15.99", color: "bg-rose-500",    pos: false },
                { name: "Salary",      cat: "Income",        amount: "+$4,200", color: "bg-emerald-500", pos: true  },
                { name: "Grocery run", cat: "Food",          amount: "-$84.20", color: "bg-amber-500",   pos: false },
                { name: "Spotify",     cat: "Entertainment", amount: "-$9.99",  color: "bg-violet-500",  pos: false },
              ].map((tx, i) => (
                <motion.div
                  key={tx.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-lg ${tx.color} opacity-80 shrink-0`} />
                    <div>
                      <p className="text-[11px] text-white/70 font-medium leading-none">{tx.name}</p>
                      <p className="text-[9px] text-white/20 mt-0.5">{tx.cat}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold ${tx.pos ? "text-emerald-400" : "text-rose-400"}`}>
                    {tx.amount}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY   = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpa = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="bg-[#080b14] text-white min-h-screen overflow-x-hidden">

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#080b14]/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold">WalletWise</span>
        </div>
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
              Dashboard
            </Link>
            <Link href="/dashboard" className="text-sm bg-white text-gray-900 font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              Open app →
            </Link>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">Sign in</button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="text-sm bg-white text-gray-900 font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-all active:scale-95">
                Get started free
              </button>
            </SignInButton>
          </Show>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        <Orb className="w-[600px] h-[600px] bg-blue-600 -top-32 -left-32" />
        <Orb className="w-[500px] h-[500px] bg-violet-600 top-1/2 -right-48" />
        <Orb className="w-[400px] h-[400px] bg-cyan-500 bottom-0 left-1/3" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "64px 64px" }} />

        <motion.div style={{ y: heroY, opacity: heroOpa }} className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 text-sm px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Free forever · No credit card
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6">
            Your money,{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">finally</span>
            <br />under control.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
            className="text-lg text-white/50 max-w-lg mb-10 leading-relaxed">
            Track every dollar, hit your savings goals, and never blow your budget —
            with beautiful charts and smart auto-categorization.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-8 py-3.5 rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-95">
                  Start for free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-8 py-3.5 rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-95">
                Go to dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Show>
            <span className="text-sm text-white/30">No setup. Works instantly.</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 w-full max-w-3xl">
            <DashboardPreview />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20">
          <span className="text-xs">scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(s => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-1">{s.value}</p>
                <p className="text-sm text-white/40">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-sm text-blue-400 font-semibold uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Built for people who care<br />
              <span className="text-white/30">about their finances.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 overflow-hidden hover:border-white/20 transition-colors duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500 rounded-2xl`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 border-t border-white/5">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-4xl mx-auto">
          <motion.p variants={fadeUp} className="text-center text-white/30 text-sm mb-8 uppercase tracking-widest">What people say</motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { quote: "Finally a budget app that doesn't feel like a spreadsheet.", name: "Alex M.",    role: "Designer"  },
              { quote: "The auto-categorization saves me so much time every month.",  name: "Priya K.",  role: "Engineer"  },
              { quote: "I hit my emergency fund goal in 4 months using this.",        name: "Jordan T.", role: "Teacher"   },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-white/30">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <motion.div initial="hidden" whileInView="show" variants={stagger} viewport={{ once: true }} className="relative max-w-2xl mx-auto text-center">
          <Orb className="w-[400px] h-[400px] bg-blue-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <motion.h2 variants={fadeUp} className="relative text-4xl md:text-5xl font-bold mb-5">
            Take control of your<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">financial future.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="relative text-white/40 mb-8">Free forever. No credit card. Set up in under 2 minutes.</motion.p>
          <motion.div variants={fadeUp} className="relative">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-10 py-4 rounded-2xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 active:scale-95 text-base">
                  Get started — it&apos;s free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-10 py-4 rounded-2xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 active:scale-95 text-base">
                Open dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Show>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/20 text-xs max-w-6xl mx-auto">
        <div className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5" /><span>WalletWise</span></div>
        <span>© {new Date().getFullYear()} — Built with Next.js, Tailwind & ❤️</span>
        <span>Free forever</span>
      </footer>
    </div>
  );
}