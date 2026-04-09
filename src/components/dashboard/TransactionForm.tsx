// src/components/dashboard/TransactionForm.tsx
//
// This single form handles BOTH adding a new transaction AND editing an existing one.
// How? We pass an optional "transaction" prop.
// - If it's undefined → we're adding (POST)
// - If it has a value  → we're editing (PATCH)
//
// This pattern (one form, two modes) avoids duplicating form logic.

"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { CATEGORIES } from "@/lib/categories";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { autoCategorize } from "@/lib/categories";
import type { Transaction } from "@/hooks/useTransactions";

interface TransactionFormProps {
  transaction?: Transaction;       // undefined = add mode, defined = edit mode
  onSuccess: () => void;           // called after save so parent can refresh the list
  onCancel: () => void;
}

export default function TransactionForm({
  transaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const isEditing = !!transaction;

  // Form state — pre-fill with existing values when editing
  const [name,     setName]     = useState(transaction?.name     ?? "");
  const [amount,   setAmount]   = useState(transaction?.amount   ?? "");
  const [type,     setType]     = useState<"income"|"expense">(transaction?.type ?? "expense");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [currency, setCurrency] = useState(transaction?.currency ?? "USD");
  const [date,     setDate]     = useState(
    transaction?.date
      ? new Date(transaction.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [note,     setNote]     = useState(transaction?.note ?? "");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Auto-suggest a category as the user types the transaction name
  // We only auto-suggest if the user hasn't manually picked a category yet
  useEffect(() => {
    if (name && !isEditing) {
      const suggested = autoCategorize(name);
      setCategory(suggested);
    }
  }, [name, isEditing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // prevent browser page reload on form submit
    setError("");

    if (!name.trim() || !amount || !date) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = { name, amount: Number(amount), type, category, currency, date, note };

      const res = await fetch(
        isEditing ? `/api/transactions/${transaction!.id}` : "/api/transactions",
        {
          method:  isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Something went wrong");
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = CATEGORIES.map(c => ({ value: c.name, label: `${c.icon} ${c.name}` }));
  const currencyOptions = SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Income / Expense toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        {(["expense", "income"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              type === t
                ? t === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Input
        label="Description *"
        placeholder="e.g. Netflix, Grocery run, Salary"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      {/* Amount + Currency side by side */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount *"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <Select
          label="Currency"
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          options={currencyOptions}
        />
      </div>

      <Select
        label="Category"
        value={category}
        onChange={e => setCategory(e.target.value)}
        options={categoryOptions}
      />

      <Input
        label="Date *"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Note (optional)</label>
        <textarea
          rows={2}
          placeholder="Any extra details..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {isEditing ? "Save changes" : "Add transaction"}
        </Button>
      </div>

    </form>
  );
}