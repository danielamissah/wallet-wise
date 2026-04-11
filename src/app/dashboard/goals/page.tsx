"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoals } from "@/hooks/useGoals";
import type { Goal } from "@/hooks/useGoals";
import { formatCurrency, cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageTransition from "@/components/ui/PageTransition";
import { Plus, Pencil, Trash2, CheckCircle2, PiggyBank } from "lucide-react";

const GOAL_COLORS = ["#378ADD","#1D9E75","#7F77DD","#EF9F27","#D85A30","#D4537E"];

interface GoalForm { name: string; targetAmount: string; savedAmount: string; currency: string; color: string; }
const EMPTY: GoalForm = { name: "", targetAmount: "", savedAmount: "0", currency: "USD", color: GOAL_COLORS[0] };

export default function GoalsPage() {
  const { goals, loading, refetch } = useGoals();
  const [formModal,  setFormModal]  = useState<null | "add" | Goal>(null);
  const [fundsModal, setFundsModal] = useState<Goal | null>(null);
  const [form,       setForm]       = useState<GoalForm>(EMPTY);
  const [addAmount,  setAddAmount]  = useState("");
  const [saving,     setSaving]     = useState(false);

  function openAdd() { setForm(EMPTY); setFormModal("add"); }
  function openEdit(g: Goal) {
    setForm({ name: g.name, targetAmount: g.targetAmount, savedAmount: g.savedAmount, currency: g.currency, color: g.color });
    setFormModal(g);
  }
  function setField<K extends keyof GoalForm>(k: K, v: GoalForm[K]) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.name.trim() || !form.targetAmount) return;
    setSaving(true);
    try {
      if (formModal === "add") {
        await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else if (formModal && typeof formModal === "object") {
        await fetch(`/api/goals/${formModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      await refetch(); setFormModal(null);
    } finally { setSaving(false); }
  }

  async function handleAddFunds() {
    if (!fundsModal || !addAmount || Number(addAmount) <= 0) return;
    setSaving(true);
    try {
      const newSaved  = Number(fundsModal.savedAmount) + Number(addAmount);
      const completed = newSaved >= Number(fundsModal.targetAmount);
      await fetch(`/api/goals/${fundsModal.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedAmount: String(newSaved), completed }),
      });
      await refetch(); setFundsModal(null); setAddAmount("");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    refetch();
  }

  async function toggleComplete(g: Goal) {
    await fetch(`/api/goals/${g.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !g.completed }),
    });
    refetch();
  }

  const active    = goals.filter(g => !g.completed);
  const completed = goals.filter(g =>  g.completed);
  const totalSaved  = goals.reduce((s, g) => s + Number(g.savedAmount),  0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.targetAmount), 0);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Savings goals</h1>
            <p className="text-sm text-gray-400 mt-0.5">{formatCurrency(totalSaved)} saved of {formatCurrency(totalTarget)} total</p>
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
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Active</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {active.map((goal, i) => {
                      const saved  = Number(goal.savedAmount);
                      const target = Number(goal.targetAmount);
                      const pct    = Math.min(100, (saved / target) * 100);
                      return (
                        <motion.div key={goal.id}
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.06, duration: 0.35 }}
                          whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                          <Card className="h-full">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: goal.color }} />
                                <span className="text-sm font-semibold text-gray-800 truncate">{goal.name}</span>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 ml-2">
                                <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => toggleComplete(goal)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-300 hover:text-green-500 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-2xl font-bold text-gray-900">{formatCurrency(saved, goal.currency)}</span>
                              <span className="text-xs text-gray-400">of {formatCurrency(target, goal.currency)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                                className="h-full rounded-full" style={{ background: goal.color }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">{pct.toFixed(0)}% · {formatCurrency(target - saved, goal.currency)} to go</span>
                              <button onClick={() => { setFundsModal(goal); setAddAmount(""); }}
                                className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                                style={{ background: goal.color + "18", color: goal.color }}>
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
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Completed 🎉</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {completed.map(goal => (
                    <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                      <Card className="opacity-75 h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-gray-600 truncate">{goal.name}</span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 ml-2">
                            <button onClick={() => toggleComplete(goal)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-amber-500 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-700 mb-2">{formatCurrency(Number(goal.targetAmount), goal.currency)}</p>
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

        {/* Add/Edit modal */}
        <Modal open={formModal !== null} onClose={() => setFormModal(null)}
          title={formModal === "add" ? "New savings goal" : "Edit goal"}>
          <div className="space-y-4">
            <Input label="Goal name *" placeholder="Emergency fund, New laptop…"
              value={form.name} onChange={e => setField("name", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Target amount *" type="number" min="1" step="0.01" placeholder="1000"
                value={form.targetAmount} onChange={e => setField("targetAmount", e.target.value)} />
              <Input label="Saved so far" type="number" min="0" step="0.01" placeholder="0"
                value={form.savedAmount} onChange={e => setField("savedAmount", e.target.value)} />
            </div>
            <Select label="Currency" value={form.currency} onChange={e => setField("currency", e.target.value)}
              options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))} />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Color</label>
              <div className="flex gap-2">
                {GOAL_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setField("color", color)}
                    className={cn("w-7 h-7 rounded-full transition-all duration-200",
                      form.color === color && "scale-125 ring-2 ring-offset-2 ring-gray-400")}
                    style={{ background: color }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setFormModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {formModal === "add" ? "Create goal" : "Save changes"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add funds modal */}
        <Modal open={fundsModal !== null} onClose={() => setFundsModal(null)}
          title={`Add funds — ${fundsModal?.name}`}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Current progress</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(Number(fundsModal?.savedAmount), fundsModal?.currency)}</p>
              <p className="text-xs text-gray-400">of {formatCurrency(Number(fundsModal?.targetAmount), fundsModal?.currency)}</p>
              {fundsModal && (
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (Number(fundsModal.savedAmount) / Number(fundsModal.targetAmount)) * 100)}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full" style={{ background: fundsModal.color }}
                  />
                </div>
              )}
            </div>
            <Input label="Amount to add" type="number" min="0.01" step="0.01" placeholder="50.00"
              value={addAmount} onChange={e => setAddAmount(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setFundsModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddFunds} loading={saving} className="flex-1">Add funds</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}