// src/app/dashboard/recurring/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRecurring } from "@/hooks/useRecurring";
import type { RecurringTransaction } from "@/hooks/useRecurring";
import { useCurrency } from "@/hooks/useCurrency";
import { CATEGORIES, getCategoryColor, getCategoryIcon } from "@/lib/categories";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { formatCurrency, getPreferredCurrency, cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageTransition from "@/components/ui/PageTransition";
import { Plus, Trash2, Pencil, Pause, Play, RefreshCw, Calendar } from "lucide-react";

interface RForm {
  name: string; amount: string; type: "income" | "expense";
  category: string; currency: string;
  frequency: "monthly" | "weekly" | "biweekly";
  dayOfPeriod: string; notes: string;
}

interface FormErrors { name?: string; amount?: string; }

const FREQ_LABELS: Record<string, string> = {
  monthly:  "Monthly",
  weekly:   "Weekly",
  biweekly: "Bi-weekly",
};

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday"    },
  { value: "1", label: "Monday"    },
  { value: "2", label: "Tuesday"   },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday"  },
  { value: "5", label: "Friday"    },
  { value: "6", label: "Saturday"  },
];

function emptyForm(preferred: string): RForm {
  return {
    name: "", amount: "", type: "expense", category: "Housing",
    currency: preferred, frequency: "monthly", dayOfPeriod: "1", notes: "",
  };
}

export default function RecurringPage() {
  const { items, loading, refetch } = useRecurring();
  const { rates }                   = useCurrency();

  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [modal,    setModal]    = useState<null | "add" | RecurringTransaction>(null);
  const [form,     setForm]     = useState<RForm>(emptyForm("USD"));
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Read preferred currency and update live on storage change
  useEffect(() => {
    function update() { setDisplayCurrency(getPreferredCurrency()); }
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  // Convert any amount from its stored currency to display currency
  function toDisplay(amount: number, fromCurrency: string): string {
    if (!rates || Object.keys(rates).length === 0) {
      return formatCurrency(amount, fromCurrency);
    }
    if (fromCurrency === displayCurrency) return formatCurrency(amount, displayCurrency);
    const usd  = amount / (rates[fromCurrency] ?? 1);
    const disp = usd * (rates[displayCurrency] ?? 1);
    return formatCurrency(disp, displayCurrency);
  }

  // Convert to monthly display amount for summaries
  function toMonthlyDisplay(item: RecurringTransaction): number {
    const amount    = Number(item.amount);
    const usd       = amount / (rates[item.currency] ?? 1);
    const monthlyUsd =
      item.frequency === "weekly"   ? usd * 4.33 :
      item.frequency === "biweekly" ? usd * 2.17 :
      usd;
    return monthlyUsd * (rates[displayCurrency] ?? 1);
  }

  function openAdd() {
    setForm(emptyForm(displayCurrency));
    setErrors({});
    setModal("add");
  }

  function openEdit(item: RecurringTransaction) {
    setForm({
      name:        item.name,
      amount:      item.amount,
      type:        item.type,
      category:    item.category,
      currency:    item.currency,
      frequency:   item.frequency,
      dayOfPeriod: String(item.dayOfPeriod),
      notes:       item.notes ?? "",
    });
    setErrors({});
    setModal(item);
  }

  function setField<K extends keyof RForm>(k: K, v: RForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof FormErrors]) setErrors(e => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())                        e.name   = "Please enter a name.";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Please enter a valid amount.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        amount:      Number(form.amount),
        type:        form.type,
        category:    form.category,
        currency:    form.currency,
        frequency:   form.frequency,
        dayOfPeriod: Number(form.dayOfPeriod),
        notes:       form.notes.trim() || null,
      };
      if (modal === "add") {
        await fetch("/api/recurring", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (typeof modal === "object" && modal !== null) {
        await fetch(`/api/recurring/${modal.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await refetch();
      setModal(null);
    } finally { setSaving(false); }
  }

  async function handleToggleActive(item: RecurringTransaction) {
    await fetch(`/api/recurring/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recurring transaction?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      refetch();
    } finally { setDeleting(null); }
  }

  const active   = items.filter(i =>  i.active);
  const paused   = items.filter(i => !i.active);
  const expenses = active.filter(i => i.type === "expense");
  const incomes  = active.filter(i => i.type === "income");

  // All summaries in display currency via proper conversion
  const monthlyExpenses = expenses.reduce((s, i) => s + toMonthlyDisplay(i), 0);
  const monthlyIncome   = incomes.reduce((s,  i) => s + toMonthlyDisplay(i), 0);

  // Items due in the next 7 days
  const upcoming = active.filter(i => {
    if (!i.nextDue) return false;
    const due = new Date(i.nextDue);
    const now = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    return due >= now && due <= in7;
  }).sort((a, b) => new Date(a.nextDue!).getTime() - new Date(b.nextDue!).getTime());

  const isMonthly = form.frequency === "monthly";

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Recurring</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              Manage bills, subscriptions, and regular income
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Add recurring
          </Button>
        </div>

        {/* Summary — everything in display currency */}
        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Monthly committed</p>
              <p className="text-xl font-bold text-red-500 dark:text-red-400">
                -{formatCurrency(monthlyExpenses, displayCurrency)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Recurring income</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +{formatCurrency(monthlyIncome, displayCurrency)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Active items</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{active.length}</p>
            </Card>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Due in the next 7 days
              </p>
            </div>
            <div className="space-y-2">
              {upcoming.map(item => (
                <div key={item.id}
                  className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(item.nextDue!).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${item.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                      {item.type === "income" ? "+" : "-"}{toDisplay(Number(item.amount), item.currency)}
                    </p>
                    {/* Show original if different */}
                    {item.currency !== displayCurrency && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatCurrency(Number(item.amount), item.currency)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">No recurring transactions yet</p>
            <Button size="sm" onClick={openAdd}>Add your first one</Button>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Active items */}
        {active.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Active</h2>
            <div className="space-y-2">
              {active.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl group"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: getCategoryColor(item.category) + "22" }}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: getCategoryColor(item.category) + "22", color: getCategoryColor(item.category) }}>
                        {item.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {FREQ_LABELS[item.frequency]}
                        {item.frequency === "monthly" && ` · Day ${item.dayOfPeriod}`}
                        {(item.frequency === "weekly" || item.frequency === "biweekly") &&
                          ` · ${DAYS_OF_WEEK.find(d => d.value === String(item.dayOfPeriod))?.label ?? ""}`
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${item.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                        {item.type === "income" ? "+" : "-"}{toDisplay(Number(item.amount), item.currency)}
                      </p>
                      {/* Show original currency if stored differently */}
                      {item.currency !== displayCurrency && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatCurrency(Number(item.amount), item.currency)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(item)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/40 text-gray-300 dark:text-gray-600 hover:text-amber-500 transition-colors"
                        title="Pause">
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors disabled:opacity-40">
                        {deleting === item.id
                          ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Paused */}
        {paused.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Paused</h2>
            <div className="space-y-2">
              {paused.map(item => (
                <div key={item.id}
                  className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl opacity-60">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: getCategoryColor(item.category) + "22" }}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {FREQ_LABELS[item.frequency]} · Paused
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                      {toDisplay(Number(item.amount), item.currency)}
                    </p>
                    <button onClick={() => handleToggleActive(item)}
                      className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-300 dark:text-gray-600 hover:text-green-500 transition-colors"
                      title="Resume">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Add / Edit modal */}
        <Modal
          open={modal !== null}
          onClose={() => setModal(null)}
          title={modal === "add" ? "Add recurring transaction" : "Edit recurring transaction"}
        >
          <div className="space-y-4">
            {/* Income / Expense toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {(["expense", "income"] as const).map(t => (
                <button key={t} type="button" onClick={() => setField("type", t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    form.type === t
                      ? t === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}>
                  {t === "expense" ? "💸 Expense" : "💰 Income"}
                </button>
              ))}
            </div>

            <Input
              label="Name *"
              placeholder="Rent, Netflix, Salary…"
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              error={errors.name}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Amount *"
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount}
                onChange={e => setField("amount", e.target.value)}
                error={errors.amount}
              />
              <Select
                label="Currency"
                value={form.currency}
                onChange={e => setField("currency", e.target.value)}
                options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
              />
            </div>

            <Select
              label="Category"
              value={form.category}
              onChange={e => setField("category", e.target.value)}
              options={CATEGORIES.map(c => ({ value: c.name, label: `${c.icon} ${c.name}` }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Frequency"
                value={form.frequency}
                onChange={e => setField("frequency", e.target.value as RForm["frequency"])}
                options={[
                  { value: "monthly",  label: "Monthly"   },
                  { value: "weekly",   label: "Weekly"    },
                  { value: "biweekly", label: "Bi-weekly" },
                ]}
              />
              {isMonthly ? (
                <Input
                  label="Day of month"
                  type="number" min="1" max="31" placeholder="1"
                  value={form.dayOfPeriod}
                  onChange={e => setField("dayOfPeriod", e.target.value)}
                />
              ) : (
                <Select
                  label="Day of week"
                  value={form.dayOfPeriod}
                  onChange={e => setField("dayOfPeriod", e.target.value)}
                  options={DAYS_OF_WEEK}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
              <textarea rows={2} placeholder="Any extra details…"
                value={form.notes} onChange={e => setField("notes", e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {modal === "add" ? "Add recurring" : "Save changes"}
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageTransition>
  );
}