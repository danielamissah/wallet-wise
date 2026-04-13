// src/components/dashboard/TransactionForm.tsx
"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { CATEGORIES, autoCategorize } from "@/lib/categories";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import type { Transaction } from "@/hooks/useTransactions";

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  amount?: string;
  date?: string;
  general?: string;
}

export default function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const isEditing = !!transaction;

  const [name,     setName]     = useState(transaction?.name     ?? "");
  const [amount,   setAmount]   = useState(transaction?.amount   ?? "");
  const [type,     setType]     = useState<"income" | "expense">(transaction?.type ?? "expense");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [currency, setCurrency] = useState(transaction?.currency ?? "USD");
  const [date,     setDate]     = useState(
    transaction?.date
      ? new Date(transaction.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [note,    setNote]    = useState(transaction?.note ?? "");
  const [errors,  setErrors]  = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      const preferred = localStorage.getItem("walletwise_currency");
      if (preferred) setCurrency(preferred);
    }
  }, [isEditing]);

  useEffect(() => {
    if (name && !isEditing) setCategory(autoCategorize(name));
  }, [name, isEditing]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim())             e.name   = "Please enter a description.";
    if (!amount || Number(amount) <= 0) e.amount = "Please enter an amount greater than 0.";
    if (!date)                    e.date   = "Please select a date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function clearError(field: keyof FormErrors) {
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: name.trim(), amount: Number(amount), type,
        category: category || autoCategorize(name),
        currency, date, note: note.trim() || null,
      };
      const url    = isEditing ? `/api/transactions/${transaction!.id}` : "/api/transactions";
      const method = isEditing ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Something went wrong");
      }
      onSuccess();
    } catch (e) {
      setErrors({ general: e instanceof Error ? e.message : "Failed to save. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = CATEGORIES.map(c => ({ value: c.name, label: `${c.icon} ${c.name}` }));
  const currencyOptions = SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {(["expense", "income"] as const).map(t => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              type === t
                ? t === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}>
            {t === "expense" ? "💸 Expense" : "💰 Income"}
          </button>
        ))}
      </div>

      <Input label="Description *" placeholder="e.g. Netflix, Grocery run, Salary"
        value={name} onChange={e => { setName(e.target.value); clearError("name"); }}
        error={errors.name} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Amount *" type="number" min="0.01" step="0.01" placeholder="0.00"
          value={amount} onChange={e => { setAmount(e.target.value); clearError("amount"); }}
          error={errors.amount} />
        <Select label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}
          options={currencyOptions} />
      </div>

      <Select label="Category" value={category} onChange={e => setCategory(e.target.value)}
        options={categoryOptions} />

      <Input label="Date *" type="date" value={date}
        onChange={e => { setDate(e.target.value); clearError("date"); }}
        error={errors.date} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note (optional)</label>
        <textarea rows={2} placeholder="Any extra details…" value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors" />
      </div>

      {errors.general && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl">
          <span className="shrink-0">⚠️</span>
          <span>{errors.general}</span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {isEditing ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}