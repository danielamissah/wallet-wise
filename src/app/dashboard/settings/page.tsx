// src/app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import PageTransition from "@/components/ui/PageTransition";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { CheckCircle2, User, Palette, Info, Star, MessageSquare } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [saved,  setSaved]  = useState(false);

  // Review form state
  const [rating,      setRating]      = useState(5);
  const [comment,     setComment]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [reviewDone,  setReviewDone]  = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("walletwise_currency");
    if (stored) setDefaultCurrency(stored);

    // Check if user already left a review this session
    const done = localStorage.getItem("walletwise_reviewed");
    if (done) setReviewDone(true);
  }, []);

  function handleSave() {
    localStorage.setItem("walletwise_currency", defaultCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleReviewSubmit() {
    setReviewError("");
    if (!comment.trim() || comment.trim().length < 10) {
      setReviewError("Please write at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to submit");
      }
      setReviewDone(true);
      setComment("");
      localStorage.setItem("walletwise_reviewed", "true");
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5 max-w-lg">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your WalletWise preferences</p>
        </div>

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Profile</h2>
            </div>
            <div className="flex items-center gap-4">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0] ?? "?"}
                </div>
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
            <p className="text-xs text-gray-400 mt-4 bg-gray-50 rounded-xl px-3 py-2">
              To update your name or photo, use the account menu in the sidebar.
            </p>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
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
                options={SUPPORTED_CURRENCIES.map(c => ({
                  value: c.code,
                  label: `${c.code} — ${c.name} (${c.symbol})`,
                }))}
              />
              <p className="text-xs text-gray-400">
                This sets the pre-selected currency when adding new transactions.
              </p>
              <Button onClick={handleSave}>
                {saved
                  ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  : "Save preferences"
                }
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Leave a review */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Leave a review</h2>
            </div>

            {reviewDone ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Thank you for your review!
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    It will appear on the WalletWise homepage.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Star rating */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Your rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className="w-7 h-7 transition-colors"
                          fill={star <= rating ? "#f59e0b" : "none"}
                          stroke={star <= rating ? "#f59e0b" : "#d1d5db"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Your review *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What do you love about WalletWise? How has it helped you?"
                    value={comment}
                    onChange={e => {
                      setComment(e.target.value);
                      if (reviewError) setReviewError("");
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-400">
                    {comment.trim().length}/10 minimum characters
                    {comment.trim().length >= 10 && " ✓"}
                  </p>
                </div>

                {reviewError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                    ⚠ {reviewError}
                  </p>
                )}

                <Button
                  onClick={handleReviewSubmit}
                  loading={submitting}
                  className="w-full justify-center"
                >
                  <Star className="w-4 h-4" />
                  Submit review
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11px] font-medium">
                  v1.0.0
                </span>
                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[11px] font-medium">
                  Free forever
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}