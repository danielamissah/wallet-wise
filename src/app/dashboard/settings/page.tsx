"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import PageTransition from "@/components/ui/PageTransition";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { CheckCircle2, User, Palette, Info } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("walletwise_currency");
    if (stored) setDefaultCurrency(stored);
  }, []);

  function handleSave() {
    localStorage.setItem("walletwise_currency", defaultCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const sections = [
    { icon: User,    label: "Profile"     },
    { icon: Palette, label: "Preferences" },
    { icon: Info,    label: "About"       },
  ];

  return (
    <PageTransition>
      <div className="space-y-5 max-w-lg">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your WalletWise preferences</p>
        </div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Profile</h2>
            </div>
            <div className="flex items-center gap-4">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="Profile" className="w-12 h-12 rounded-full ring-2 ring-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0] ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.fullName ?? "—"}</p>
                <p className="text-xs text-gray-400">{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 bg-gray-50 rounded-xl px-3 py-2">
              To update your name or photo, use the account menu in the sidebar.
            </p>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Preferences</h2>
            </div>
            <div className="space-y-4">
              <Select
                label="Default currency"
                value={defaultCurrency}
                onChange={e => setDefaultCurrency(e.target.value)}
                options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} — ${c.name} (${c.symbol})` }))}
              />
              <p className="text-xs text-gray-400">This sets the pre-selected currency when adding new transactions.</p>
              <Button onClick={handleSave}>
                {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Save preferences"}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">About WalletWise</h2>
            </div>
            <div className="space-y-1.5 text-xs text-gray-400">
              <p>Built with Next.js 15, Tailwind CSS, Drizzle ORM, Neon & Clerk.</p>
              <p>Exchange rates via open.er-api.com — updated daily.</p>
              <p>Animations powered by Framer Motion.</p>
              <div className="flex items-center gap-2 pt-2">
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11px] font-medium">v1.0.0</span>
                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[11px] font-medium">Free forever</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}