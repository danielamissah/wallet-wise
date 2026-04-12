// src/app/dashboard/goals/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoals } from "@/hooks/useGoals";
import { useCurrency } from "@/hooks/useCurrency";
import type { Goal } from "@/hooks/useGoals";
import { formatCurrency, cn, getPreferredCurrency } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageTransition from "@/components/ui/PageTransition";
import { Plus, Pencil, Trash2, CheckCircle2, PiggyBank } from "lucide-react";

const GOAL_COLORS = ["#378ADD","#1D9E75","#7F77DD","#EF9F27","#D85A30","#D4537E"];

interface GoalForm {
  name: string;
  targetAmount: string;
  savedAmount: string;
  currency: string;
  color: string;
}

interface FormErrors {
  name?: string;
  targetAmount?: string;
  savedAmount?: string;
  addAmount?: string;
}

export default function GoalsPage() {
  const { goals, loading, refetch } = useGoals();
  const { rates } = useCurrency();

  const [formModal,  setFormModal]  = useState<null | "add" | Goal>(null);
  const [fundsModal, setFundsModal] = useState<Goal | null>(null);
  const [form,       setForm]       = useState<GoalForm>({
    name: "", targetAmount: "", savedAmount: "0",
    currency: "USD", color: GOAL_COLORS[0],
  });
  const [errors,    setErrors]    = useState<FormErrors>({});
  const [addAmount, setAddAmount] = useState("");
  const [saving,    setSaving]    = useState(false);

  // Preferred display currency
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");

  useEffect(() => {
    const p = getPreferredCurrency();
    setDisplayCurrency(p);
    setPreferredCurrency(p);
  }, []);

  // Convert any amount in a given currency to the display currency
  function toDisplay(amount: number, fromCurrency: string): string {
    if (fromCurrency === displayCurrency) {
      return formatCurrency(amount, displayCurrency);
    }
    // fromCurrency → USD → displayCurrency
    const toUsd        = amount / (rates[fromCurrency] ?? 1);
    const toDisp       = toUsd * (rates[displayCurrency] ?? 1);
    return formatCurrency(toDisp, displayCurrency);
  }

  function openAdd() {
    setForm({
      name: "", targetAmount: "", savedAmount: "0",
      currency: preferredCurrency,
      color: GOAL_COLORS[0],
    });
    setErrors({});
    setFormModal("add");
  }

  function openEdit(g: Goal) {
    setForm({
      name:         g.name,
      targetAmount: g.targetAmount,
      savedAmount:  g.savedAmount,
      currency:     g.currency,
      color:        g.color,
    });
    setErrors({});
    setFormModal(g);
  }

  function setField<K extends keyof GoalForm>(k: K, v: GoalForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof FormErrors]) {
      setErrors(e => ({ ...e, [k]: undefined }));
    }
  }

  function validateGoalForm(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())
      e.name = "Please enter a goal name.";
    if (!form.targetAmount || Number(form.targetAmount) <= 0)
      e.targetAmount = "Please enter a target amount greater than 0.";
    if (form.savedAmount !== "" && Number(form.savedAmount) < 0)
      e.savedAmount = "Saved amount cannot be negative.";
    if (form.targetAmount && form.savedAmount &&
        Number(form.savedAmount) > Number(form.targetAmount))
      e.savedAmount = "Saved amount cannot exceed the target.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateFundsForm(): boolean {
    const e: FormErrors = {};
    if (!addAmount || Number(addAmount) <= 0)
      e.addAmount = "Please enter an amount greater than 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validateGoalForm()) return;
    setSaving(true);
    try {
      if (formModal === "add") {
        await fetch("/api/goals", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });
      } else if (formModal && typeof formModal === "object") {
        await fetch(`/api/goals/${formModal.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });
      }
      await refetch();
      setFormModal(null);
    } catch {
      setErrors({ name: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFunds() {
    if (!validateFundsForm() || !fundsModal) return;
    setSaving(true);
    try {
      const newSaved  = Number(fundsModal.savedAmount) + Number(addAmount);
      const completed = newSaved >= Number(fundsModal.targetAmount);
      await fetch(`/api/goals/${fundsModal.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ savedAmount: String(newSaved), completed }),
      });
      await refetch();
      setFundsModal(null);
      setAddAmount("");
      setErrors({});
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    refetch();
  }

  async function toggleComplete(g: Goal) {
    await fetch(`/api/goals/${g.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ completed: !g.completed }),
    });
    refetch();
  }

  const active    = goals.filter(g => !g.completed);
  const completed = goals.filter(g =>  g.completed);

  // Header totals — convert each goal's amounts to display currency then sum
  const totalSaved = goals.reduce((s, g) => {
    const rate = (rates[displayCurrency] ?? 1) / (rates[g.currency] ?? 1);
    return s + Number(g.savedAmount) * rate;
  }, 0);
  const totalTarget = goals.reduce((s, g) => {
    const rate = (rates[displayCurrency] ?? 1) / (rates[g.currency] ?? 1);
    return s + Number(g.targetAmount) * rate;
  }, 0);

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* Header — totals now in display currency */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Savings goals</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {formatCurrency(totalSaved, displayCurrency)} saved
              {" "}of{" "}
              {formatCurrency(totalTarget, displayCurrency)} total
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> New goal
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 gap-3">
            <PiggyBank className="w-10 h-10 text-gray-200" />
            <p className="text-gray-400 text-sm">No savings goals yet</p>
            <Button size="sm" onClick={openAdd}>Create your first goal</Button>
          </Card>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Active
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {active.map((goal, i) => {
                      const saved     = Number(goal.savedAmount);
                      const target    = Number(goal.targetAmount);
                      const pct       = Math.min(100, (saved / target) * 100);
                      const remaining = target - saved;
                      return (
                        <motion.div key={goal.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.06, duration: 0.35 }}
                          whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        >
                          <Card className="h-full">
                            {/* Goal name + actions */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                                  style={{ background: goal.color }}
                                />
                                <span className="text-sm font-semibold text-gray-800 truncate">
                                  {goal.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 ml-2">
                                <button onClick={() => openEdit(goal)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => toggleComplete(goal)}
                                  className="p-1.5 rounded-lg hover:bg-green-50 text-gray-300 hover:text-green-500 transition-colors">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(goal.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Amounts — show in goal's own currency */}
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(saved, goal.currency)}
                              </span>
                              <span className="text-xs text-gray-400">
                                of {formatCurrency(target, goal.currency)}
                              </span>
                            </div>

                            {/* If goal currency differs from display currency, show converted */}
                            {goal.currency !== displayCurrency && (
                              <p className="text-xs text-gray-400 mb-1">
                                ≈ {toDisplay(saved, goal.currency)} of {toDisplay(target, goal.currency)}
                              </p>
                            )}

                            {/* Progress bar */}
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ background: goal.color }}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {pct.toFixed(0)}% · {formatCurrency(remaining, goal.currency)} to go
                              </span>
                              <button
                                onClick={() => { setFundsModal(goal); setAddAmount(""); setErrors({}); }}
                                className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                                style={{ background: goal.color + "18", color: goal.color }}
                              >
                                + Add funds
                              </button>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Completed 🎉
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {completed.map(goal => (
                    <motion.div key={goal.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                      <Card className="opacity-75 h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-gray-600 truncate">
                              {goal.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 ml-2">
                            <button onClick={() => toggleComplete(goal)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-amber-500 transition-colors"
                              title="Reopen">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(goal.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-700 mb-2">
                          {formatCurrency(Number(goal.targetAmount), goal.currency)}
                        </p>
                        <div className="h-1.5 bg-green-100 rounded-full">
                          <div className="h-full bg-green-400 rounded-full w-full" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Add / Edit modal */}
        <Modal
          open={formModal !== null}
          onClose={() => setFormModal(null)}
          title={formModal === "add" ? "New savings goal" : "Edit goal"}
        >
          <div className="space-y-4">
            <Input
              label="Goal name *"
              placeholder="Emergency fund, New laptop…"
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              error={errors.name}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Target amount *"
                type="number" min="1" step="0.01" placeholder="1000"
                value={form.targetAmount}
                onChange={e => setField("targetAmount", e.target.value)}
                error={errors.targetAmount}
              />
              <Input
                label="Saved so far"
                type="number" min="0" step="0.01" placeholder="0"
                value={form.savedAmount}
                onChange={e => setField("savedAmount", e.target.value)}
                error={errors.savedAmount}
              />
            </div>
            <Select
              label="Currency"
              value={form.currency}
              onChange={e => setField("currency", e.target.value)}
              options={SUPPORTED_CURRENCIES.map(c => ({
                value: c.code,
                label: `${c.code} (${c.symbol})`,
              }))}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Color</label>
              <div className="flex gap-2">
                {GOAL_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setField("color", color)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all duration-200",
                      form.color === color && "scale-125 ring-2 ring-offset-2 ring-gray-400"
                    )}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setFormModal(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {formModal === "add" ? "Create goal" : "Save changes"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add funds modal */}
        <Modal
          open={fundsModal !== null}
          onClose={() => { setFundsModal(null); setErrors({}); }}
          title={`Add funds — ${fundsModal?.name}`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Current progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(Number(fundsModal?.savedAmount), fundsModal?.currency ?? displayCurrency)}
              </p>
              <p className="text-xs text-gray-400">
                of {formatCurrency(Number(fundsModal?.targetAmount), fundsModal?.currency ?? displayCurrency)}
              </p>
              {fundsModal && (
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100,
                        (Number(fundsModal.savedAmount) / Number(fundsModal.targetAmount)) * 100
                      )}%`,
                    }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: fundsModal.color }}
                  />
                </div>
              )}
            </div>
            <Input
              label={`Amount to add (${fundsModal?.currency ?? displayCurrency}) *`}
              type="number" min="0.01" step="0.01" placeholder="50.00"
              value={addAmount}
              onChange={e => {
                setAddAmount(e.target.value);
                if (errors.addAmount) setErrors(err => ({ ...err, addAmount: undefined }));
              }}
              error={errors.addAmount}
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setFundsModal(null); setErrors({}); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddFunds} loading={saving} className="flex-1">
                Add funds
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageTransition>
  );
}