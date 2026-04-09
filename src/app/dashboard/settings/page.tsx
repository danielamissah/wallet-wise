// src/app/dashboard/settings/page.tsx
//
// Settings are stored in localStorage for simplicity —
// no database needed for user preferences like default currency.
// localStorage is a browser API that persists data between sessions.
// We use a "use client" directive because localStorage only exists in the browser,
// not on the server.

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [saved, setSaved] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("walletwise_currency");
    if (stored) setDefaultCurrency(stored);
  }, []);

  function handleSave() {
    localStorage.setItem("walletwise_currency", defaultCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your WalletWise preferences</p>
      </div>

      {/* Profile card */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {user?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.fullName ?? "—"}
            </p>
            <p className="text-xs text-gray-400">
              {user?.primaryEmailAddress?.emailAddress ?? "—"}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          To update your name or profile photo, use the account menu in the sidebar.
        </p>
      </Card>

      {/* Preferences card */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Preferences</h2>
        <div className="space-y-4">
          <Select
            label="Default currency"
            value={defaultCurrency}
            onChange={e => setDefaultCurrency(e.target.value)}
            options={SUPPORTED_CURRENCIES.map(c => ({
              value: c.code,
              label: `${c.code} — ${c.name} (${c.symbol})`,
            }))}
          />
          <p className="text-xs text-gray-400">
            This sets the pre-selected currency when adding new transactions.
          </p>
          <Button onClick={handleSave} size="md">
            {saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            ) : (
              "Save preferences"
            )}
          </Button>
        </div>
      </Card>

      {/* About card */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">About WalletWise</h2>
        <div className="space-y-1.5 text-xs text-gray-400">
          <p>Built with Next.js, Tailwind CSS, Drizzle ORM, Neon, and Clerk.</p>
          <p>Exchange rates provided by open.er-api.com — updated daily.</p>
          <p className="pt-1 text-gray-300">v1.0.0</p>
        </div>
      </Card>
    </div>
  );
}