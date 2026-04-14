// src/app/dashboard/loans/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoans } from "@/hooks/useLoan";
import type { Loan } from "@/hooks/useLoan";
import { formatCurrency, cn, getPreferredCurrency } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageTransition from "@/components/ui/PageTransition";
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  CreditCard, CheckCircle2, Calendar, TrendingDown,
} from "lucide-react";

interface LoanForm {
  name: string; lender: string; totalAmount: string;
  interestRate: string; monthlyPayment: string;
  currency: string; startDate: string; notes: string;
}

interface FormErrors {
  name?: string; totalAmount?: string; monthlyPayment?: string;
  startDate?: string; amount?: string;
}

const EMPTY_LOAN: LoanForm = {
  name: "", lender: "", totalAmount: "", interestRate: "0",
  monthlyPayment: "", currency: "USD",
  startDate: new Date().toISOString().slice(0, 10), notes: "",
};

export default function LoansPage() {
  const { loans, loading, refetch } = useLoans();

  const [addModal,     setAddModal]     = useState(false);
  const [payModal,     setPayModal]     = useState<Loan | null>(null);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [form,         setForm]         = useState<LoanForm>(EMPTY_LOAN);
  const [errors,       setErrors]       = useState<FormErrors>({});
  const [payAmount,    setPayAmount]     = useState("");
  const [payDate,      setPayDate]       = useState(new Date().toISOString().slice(0, 10));
  const [payNotes,     setPayNotes]      = useState("");
  const [saving,       setSaving]        = useState(false);
  const [deleting,     setDeleting]      = useState<string | null>(null);

  function openAdd() {
    const preferred = getPreferredCurrency();
    setForm({ ...EMPTY_LOAN, currency: preferred });
    setErrors({});
    setAddModal(true);
  }

  function setField<K extends keyof LoanForm>(k: K, v: LoanForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof FormErrors]) setErrors(e => ({ ...e, [k]: undefined }));
  }

  function validateLoan(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())           e.name          = "Please enter a loan name.";
    if (!form.totalAmount || Number(form.totalAmount) <= 0) e.totalAmount = "Please enter the total amount.";
    if (!form.monthlyPayment || Number(form.monthlyPayment) <= 0) e.monthlyPayment = "Please enter the monthly payment.";
    if (!form.startDate)             e.startDate     = "Please select a start date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validatePayment(): boolean {
    const e: FormErrors = {};
    if (!payAmount || Number(payAmount) <= 0) e.amount = "Please enter a payment amount.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAddLoan() {
    if (!validateLoan()) return;
    setSaving(true);
    try {
      await fetch("/api/loans", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          form.name.trim(),
          lender:        form.lender.trim() || null,
          totalAmount:   Number(form.totalAmount),
          interestRate:  Number(form.interestRate),
          monthlyPayment: Number(form.monthlyPayment),
          currency:      form.currency,
          startDate:     form.startDate,
          notes:         form.notes.trim() || null,
        }),
      });
      await refetch();
      setAddModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handlePayment() {
    if (!payModal || !validatePayment()) return;
    setSaving(true);
    try {
      await fetch(`/api/loans/${payModal.id}/payments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount: Number(payAmount),
          date:   payDate,
          notes:  payNotes.trim() || null,
        }),
      });
      await refetch();
      setPayModal(null);
      setPayAmount("");
      setPayNotes("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this loan and all its payment history?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/loans/${id}`, { method: "DELETE" });
      refetch();
    } finally {
      setDeleting(null);
    }
  }

  async function handleMarkPaidOff(loan: Loan) {
    await fetch(`/api/loans/${loan.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ paidOff: !loan.paidOff }),
    });
    refetch();
  }

  // Amortization schedule — how many months to pay off
  function calcPayoffDate(loan: Loan): string {
    const balance  = Number(loan.remainingBalance);
    const payment  = Number(loan.monthlyPayment);
    const rate     = Number(loan.interestRate) / 100 / 12;
    if (payment <= 0) return "—";
    if (rate === 0) {
      const months = Math.ceil(balance / payment);
      const date   = new Date();
      date.setMonth(date.getMonth() + months);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    // Standard amortization formula
    const months = Math.ceil(
      -Math.log(1 - (rate * balance) / payment) / Math.log(1 + rate)
    );
    if (!isFinite(months) || months <= 0) return "—";
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function calcTotalInterest(loan: Loan): number {
    const balance  = Number(loan.remainingBalance);
    const payment  = Number(loan.monthlyPayment);
    const rate     = Number(loan.interestRate) / 100 / 12;
    if (rate === 0) return 0;
    const months   = Math.ceil(-Math.log(1 - (rate * balance) / payment) / Math.log(1 + rate));
    if (!isFinite(months)) return 0;
    return Math.max(0, (payment * months) - balance);
  }

  const active    = loans.filter(l => !l.paidOff);
  const completed = loans.filter(l =>  l.paidOff);

  const totalDebt = active.reduce((s, l) => s + Number(l.remainingBalance), 0);
  const totalOriginal = active.reduce((s, l) => s + Number(l.totalAmount), 0);
  const totalPaid = loans.reduce((s, l) =>
    s + l.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0);

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Loans</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              Track debt, log payments, and see your payoff timeline
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Add loan
          </Button>
        </div>

        {/* Summary strip */}
        {loans.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total debt",  value: formatCurrency(totalDebt),     color: "text-red-500 dark:text-red-400"   },
              { label: "Total paid",  value: formatCurrency(totalPaid),     color: "text-green-600 dark:text-green-400" },
              { label: "Active loans", value: String(active.length),        color: "text-blue-600 dark:text-blue-400"  },
            ].map(s => (
              <Card key={s.label}>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && loans.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-16 gap-3">
            <CreditCard className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">No loans tracked yet</p>
            <Button size="sm" onClick={openAdd}>Add your first loan</Button>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Active loans */}
        {active.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              Active
            </h2>
            <div className="space-y-3">
              {active.map((loan, i) => {
                const total     = Number(loan.totalAmount);
                const remaining = Number(loan.remainingBalance);
                const paid      = total - remaining;
                const pct       = Math.min(100, (paid / total) * 100);
                const expanded  = expandedId === loan.id;
                const payoffDate = calcPayoffDate(loan);
                const totalInterest = calcTotalInterest(loan);

                return (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card className="p-0 overflow-hidden">
                      {/* Main row */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {loan.name}
                              </p>
                              {loan.lender && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                  · {loan.lender}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {Number(loan.interestRate) > 0
                                ? `${loan.interestRate}% interest`
                                : "0% interest"
                              } · {formatCurrency(Number(loan.monthlyPayment), loan.currency)}/mo
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => { setPayModal(loan); setPayAmount(""); setPayNotes(""); setErrors({}); }}
                            >
                              Pay
                            </Button>
                            <button
                              onClick={() => handleMarkPaidOff(loan)}
                              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-300 dark:text-gray-600 hover:text-green-500 transition-colors"
                              title="Mark paid off"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(loan.id)}
                              disabled={deleting === loan.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors disabled:opacity-40"
                            >
                              {deleting === loan.id
                                ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                                : <Trash2 className="w-4 h-4" />
                              }
                            </button>
                          </div>
                        </div>

                        {/* Balance row */}
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-2xl font-bold text-red-500 dark:text-red-400">
                            {formatCurrency(remaining, loan.currency)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            of {formatCurrency(total, loan.currency)} remaining
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                          />
                        </div>

                        {/* Quick stats */}
                        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                          <span>{pct.toFixed(0)}% paid</span>
                          <div className="flex items-center gap-3">
                            {loan.nextPaymentDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Next: {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            <button
                              onClick={() => setExpandedId(expanded ? null : loan.id)}
                              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors font-medium"
                            >
                              {expanded ? "Less" : "Details"}
                              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
                          >
                            <div className="p-5 space-y-4">
                              {/* Amortization summary */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  { label: "Paid so far",      value: formatCurrency(paid, loan.currency)           },
                                  { label: "Est. payoff",       value: payoffDate                                   },
                                  { label: "Est. total interest", value: formatCurrency(totalInterest, loan.currency) },
                                  { label: "Payments made",    value: String(loan.payments.length)                   },
                                ].map(s => (
                                  <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.value}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Payment history */}
                              {loan.payments.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                                    Payment history
                                  </p>
                                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {loan.payments.map(p => (
                                      <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <div>
                                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {formatCurrency(Number(p.amount), loan.currency)}
                                          </p>
                                          <p className="text-xs text-gray-400 dark:text-gray-500">
                                            Principal: {formatCurrency(Number(p.principalPaid), loan.currency)} ·
                                            Interest: {formatCurrency(Number(p.interestPaid), loan.currency)}
                                          </p>
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                          {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Paid off loans */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              Paid off 🎉
            </h2>
            <div className="space-y-3">
              {completed.map(loan => (
                <Card key={loan.id} className="opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{loan.name}</p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatCurrency(Number(loan.totalAmount), loan.currency)} · {loan.payments.length} payments
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMarkPaidOff(loan)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-300 dark:text-gray-600 hover:text-amber-500 transition-colors"
                        title="Reopen"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Add loan modal */}
        <Modal open={addModal} onClose={() => setAddModal(false)} title="Add loan">
          <div className="space-y-4">
            <Input
              label="Loan name *"
              placeholder="Car loan, Student loan, Mortgage…"
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              error={errors.name}
            />
            <Input
              label="Lender (optional)"
              placeholder="e.g. Barclays, HSBC"
              value={form.lender}
              onChange={e => setField("lender", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Total amount *"
                type="number" min="1" step="0.01" placeholder="10000"
                value={form.totalAmount}
                onChange={e => setField("totalAmount", e.target.value)}
                error={errors.totalAmount}
              />
              <Select
                label="Currency"
                value={form.currency}
                onChange={e => setField("currency", e.target.value)}
                options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Monthly payment *"
                type="number" min="1" step="0.01" placeholder="250"
                value={form.monthlyPayment}
                onChange={e => setField("monthlyPayment", e.target.value)}
                error={errors.monthlyPayment}
              />
              <Input
                label="Interest rate % (annual)"
                type="number" min="0" step="0.01" placeholder="5.5"
                value={form.interestRate}
                onChange={e => setField("interestRate", e.target.value)}
              />
            </div>
            <Input
              label="Start date *"
              type="date"
              value={form.startDate}
              onChange={e => setField("startDate", e.target.value)}
              error={errors.startDate}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
              <textarea
                rows={2}
                placeholder="Any extra details…"
                value={form.notes}
                onChange={e => setField("notes", e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setAddModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddLoan} loading={saving} className="flex-1">Add loan</Button>
            </div>
          </div>
        </Modal>

        {/* Log payment modal */}
        <Modal
          open={payModal !== null}
          onClose={() => setPayModal(null)}
          title={`Log payment — ${payModal?.name}`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Remaining balance</p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                {formatCurrency(Number(payModal?.remainingBalance), payModal?.currency ?? "USD")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Suggested: {formatCurrency(Number(payModal?.monthlyPayment), payModal?.currency ?? "USD")}/mo
              </p>
            </div>
            <Input
              label="Payment amount *"
              type="number" min="0.01" step="0.01"
              placeholder={payModal?.monthlyPayment ?? "0.00"}
              value={payAmount}
              onChange={e => { setPayAmount(e.target.value); if (errors.amount) setErrors(err => ({ ...err, amount: undefined })); }}
              error={errors.amount}
            />
            <Input
              label="Payment date"
              type="date"
              value={payDate}
              onChange={e => setPayDate(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
              <textarea rows={2} placeholder="e.g. Extra principal payment"
                value={payNotes} onChange={e => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            {Number(payModal?.interestRate) > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl">
                💡 Interest and principal split will be calculated automatically based on your {payModal?.interestRate}% rate.
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPayModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handlePayment} loading={saving} className="flex-1">Log payment</Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageTransition>
  );
}