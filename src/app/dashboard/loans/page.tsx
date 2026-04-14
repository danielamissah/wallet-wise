// src/app/dashboard/loans/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoans } from "@/hooks/useLoans";
import { useCurrency } from "@/hooks/useCurrency";
import type { Loan } from "@/hooks/useLoans";
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
  CreditCard, CheckCircle2, Calendar, TrendingDown, Pencil,
} from "lucide-react";

interface LoanForm {
  name: string; lender: string; totalAmount: string; remainingBalance: string;
  interestRate: string; monthlyPayment: string;
  currency: string; startDate: string; notes: string;
}

interface FormErrors {
  name?: string; totalAmount?: string; startDate?: string; amount?: string;
}

function emptyForm(preferred: string): LoanForm {
  return {
    name: "", lender: "", totalAmount: "", remainingBalance: "",
    interestRate: "0", monthlyPayment: "",
    currency: preferred,
    startDate: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

export default function LoansPage() {
  const { loans, loading, refetch } = useLoans();
  const { rates }                   = useCurrency();

  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [addModal,    setAddModal]    = useState(false);
  const [editLoan,    setEditLoan]    = useState<Loan | null>(null);
  const [payModal,    setPayModal]    = useState<Loan | null>(null);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [form,        setForm]        = useState<LoanForm>(emptyForm("USD"));
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [payAmount,   setPayAmount]   = useState("");
  const [payDate,     setPayDate]     = useState(new Date().toISOString().slice(0, 10));
  const [payNotes,    setPayNotes]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);

  // Read preferred currency — update live when it changes
  useEffect(() => {
    function update() { setDisplayCurrency(getPreferredCurrency()); }
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  // Convert any amount+currency to display currency
  function toDisplay(amount: number, fromCurrency: string): string {
    if (fromCurrency === displayCurrency) return formatCurrency(amount, displayCurrency);
    const usd  = amount / (rates[fromCurrency] ?? 1);
    const disp = usd * (rates[displayCurrency] ?? 1);
    return formatCurrency(disp, displayCurrency);
  }

  function openAdd() {
    setForm(emptyForm(displayCurrency));
    setErrors({});
    setAddModal(true);
  }

  function openEdit(loan: Loan) {
    setForm({
      name:             loan.name,
      lender:           loan.lender ?? "",
      totalAmount:      loan.totalAmount,
      remainingBalance: loan.remainingBalance,
      interestRate:     loan.interestRate,
      monthlyPayment:   Number(loan.monthlyPayment) > 0 ? loan.monthlyPayment : "",
      currency:         loan.currency,
      startDate:        loan.startDate
        ? new Date(loan.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      notes: loan.notes ?? "",
    });
    setErrors({});
    setEditLoan(loan);
  }

  function setField<K extends keyof LoanForm>(k: K, v: LoanForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof FormErrors]) setErrors(e => ({ ...e, [k]: undefined }));
  }

  function validateLoan(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())                          e.name        = "Please enter a loan name.";
    if (!form.totalAmount || Number(form.totalAmount) <= 0) e.totalAmount = "Please enter the total amount.";
    if (!form.startDate)                            e.startDate   = "Please select a start date.";
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
          name:           form.name.trim(),
          lender:         form.lender.trim() || null,
          totalAmount:    Number(form.totalAmount),
          remainingBalance: form.remainingBalance
            ? Number(form.remainingBalance)
            : Number(form.totalAmount),
          interestRate:   Number(form.interestRate) || 0,
          monthlyPayment: form.monthlyPayment ? Number(form.monthlyPayment) : 0,
          currency:       form.currency,
          startDate:      form.startDate,
          notes:          form.notes.trim() || null,
        }),
      });
      await refetch();
      setAddModal(false);
    } finally { setSaving(false); }
  }

  async function handleEditLoan() {
    if (!editLoan || !validateLoan()) return;
    setSaving(true);
    try {
      await fetch(`/api/loans/${editLoan.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:             form.name.trim(),
          lender:           form.lender.trim() || null,
          totalAmount:      Number(form.totalAmount),
          remainingBalance: form.remainingBalance
            ? Number(form.remainingBalance)
            : Number(form.totalAmount),
          interestRate:     Number(form.interestRate) || 0,
          monthlyPayment:   form.monthlyPayment ? Number(form.monthlyPayment) : 0,
          currency:         form.currency,
          notes:            form.notes.trim() || null,
        }),
      });
      await refetch();
      setEditLoan(null);
    } finally { setSaving(false); }
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
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this loan and all its payment history?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/loans/${id}`, { method: "DELETE" });
      refetch();
    } finally { setDeleting(null); }
  }

  async function handleMarkPaidOff(loan: Loan) {
    await fetch(`/api/loans/${loan.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ paidOff: !loan.paidOff }),
    });
    refetch();
  }

  function calcPayoffDate(loan: Loan): string {
    const balance = Number(loan.remainingBalance);
    const payment = Number(loan.monthlyPayment);
    if (payment <= 0) return "No fixed payment";
    const rate = Number(loan.interestRate) / 100 / 12;
    const months = rate === 0
      ? Math.ceil(balance / payment)
      : Math.ceil(-Math.log(1 - (rate * balance) / payment) / Math.log(1 + rate));
    if (!isFinite(months) || months <= 0) return "—";
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function calcTotalInterest(loan: Loan): number {
    const balance = Number(loan.remainingBalance);
    const payment = Number(loan.monthlyPayment);
    const rate    = Number(loan.interestRate) / 100 / 12;
    if (rate === 0 || payment <= 0) return 0;
    const months = Math.ceil(-Math.log(1 - (rate * balance) / payment) / Math.log(1 + rate));
    if (!isFinite(months)) return 0;
    return Math.max(0, (payment * months) - balance);
  }

  const active    = loans.filter(l => !l.paidOff);
  const completed = loans.filter(l =>  l.paidOff);

  const totalDebtUsd = active.reduce((s, l) => {
    const usd = Number(l.remainingBalance) / (rates[l.currency] ?? 1);
    return s + usd * (rates[displayCurrency] ?? 1);
  }, 0);

  const totalPaidUsd = loans.reduce((s, l) => {
    return s + l.payments.reduce((ps, p) => {
      const usd = Number(p.amount) / (rates[l.currency] ?? 1);
      return ps + usd * (rates[displayCurrency] ?? 1);
    }, 0);
  }, 0);

  // Shared loan form JSX — used for both add and edit
  function LoanFormFields() {
    return (
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
            label="Total loan amount *"
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
        <Input
          label="Current remaining balance"
          type="number" min="0" step="0.01"
          placeholder="Leave blank to use total amount"
          value={form.remainingBalance}
          onChange={e => setField("remainingBalance", e.target.value)}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
          Useful if the loan already existed before you started tracking it.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monthly payment (optional)"
            type="number" min="0" step="0.01" placeholder="250 — leave blank if flexible"
            value={form.monthlyPayment}
            onChange={e => setField("monthlyPayment", e.target.value)}
          />
          <Input
            label="Interest rate % p.a."
            type="number" min="0" step="0.01" placeholder="5.5 (0 for interest-free)"
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
          <textarea rows={2} placeholder="Any extra details…"
            value={form.notes} onChange={e => setField("notes", e.target.value)}
            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </div>
    );
  }

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

        {/* Summary — in display currency */}
        {loans.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Total debt</p>
              <p className="text-xl font-bold text-red-500 dark:text-red-400">
                {formatCurrency(totalDebtUsd, displayCurrency)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Total paid</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalPaidUsd, displayCurrency)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Active loans</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{active.length}</p>
            </Card>
          </div>
        )}

        {/* Empty */}
        {!loading && loans.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-16 gap-3">
            <CreditCard className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">No loans tracked yet</p>
            <Button size="sm" onClick={openAdd}>Add your first loan</Button>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Active loans */}
        {active.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Active</h2>
            <div className="space-y-3">
              {active.map((loan, i) => {
                const total     = Number(loan.totalAmount);
                const remaining = Number(loan.remainingBalance);
                const paid      = total - remaining;
                const pct       = Math.min(100, Math.max(0, (paid / total) * 100));
                const expanded  = expandedId === loan.id;
                const hasPayment = Number(loan.monthlyPayment) > 0;

                return (
                  <motion.div key={loan.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}>
                    <Card className="p-0 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{loan.name}</p>
                              {loan.lender && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">· {loan.lender}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {Number(loan.interestRate) > 0 ? `${loan.interestRate}% interest` : "0% interest"}
                              {hasPayment && ` · ${toDisplay(Number(loan.monthlyPayment), loan.currency)}/mo`}
                              {!hasPayment && " · Flexible payments"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm"
                              onClick={() => { setPayModal(loan); setPayAmount(""); setPayNotes(""); setErrors({}); }}>
                              Pay
                            </Button>
                            <button onClick={() => openEdit(loan)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors"
                              title="Edit loan">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleMarkPaidOff(loan)}
                              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-300 dark:text-gray-600 hover:text-green-500 transition-colors"
                              title="Mark paid off">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(loan.id)} disabled={deleting === loan.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors disabled:opacity-40">
                              {deleting === loan.id
                                ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                                : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Amounts — in display currency */}
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-2xl font-bold text-red-500 dark:text-red-400">
                            {toDisplay(remaining, loan.currency)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            of {toDisplay(total, loan.currency)} total
                          </span>
                        </div>

                        {/* Show original currency if different from display */}
                        {loan.currency !== displayCurrency && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                            Originally {formatCurrency(remaining, loan.currency)} of {formatCurrency(total, loan.currency)}
                          </p>
                        )}

                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                          <span>{pct.toFixed(1)}% paid off</span>
                          <div className="flex items-center gap-3">
                            {loan.nextPaymentDate && hasPayment && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Next: {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            <button onClick={() => setExpandedId(expanded ? null : loan.id)}
                              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors font-medium">
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
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  { label: "Paid so far",      value: toDisplay(paid, loan.currency)                 },
                                  { label: "Est. payoff",      value: calcPayoffDate(loan)                           },
                                  { label: "Est. interest",    value: toDisplay(calcTotalInterest(loan), loan.currency) },
                                  { label: "Payments made",    value: String(loan.payments.length)                   },
                                ].map(s => (
                                  <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.value}</p>
                                  </div>
                                ))}
                              </div>

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
                                            {toDisplay(Number(p.amount), loan.currency)}
                                          </p>
                                          <p className="text-xs text-gray-400 dark:text-gray-500">
                                            Principal: {toDisplay(Number(p.principalPaid), loan.currency)} ·
                                            Interest: {toDisplay(Number(p.interestPaid), loan.currency)}
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

        {/* Paid off */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Paid off 🎉</h2>
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
                        {toDisplay(Number(loan.totalAmount), loan.currency)} · {loan.payments.length} payments
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleMarkPaidOff(loan)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-300 dark:text-gray-600 hover:text-amber-500 transition-colors">
                        <TrendingDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(loan.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Add modal */}
        <Modal open={addModal} onClose={() => setAddModal(false)} title="Add loan">
          <LoanFormFields />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setAddModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddLoan} loading={saving} className="flex-1">Add loan</Button>
          </div>
        </Modal>

        {/* Edit modal */}
        <Modal open={editLoan !== null} onClose={() => setEditLoan(null)} title="Edit loan">
          <LoanFormFields />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setEditLoan(null)} className="flex-1">Cancel</Button>
            <Button onClick={handleEditLoan} loading={saving} className="flex-1">Save changes</Button>
          </div>
        </Modal>

        {/* Pay modal */}
        <Modal
          open={payModal !== null}
          onClose={() => setPayModal(null)}
          title={`Log payment — ${payModal?.name}`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Remaining balance</p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                {toDisplay(Number(payModal?.remainingBalance), payModal?.currency ?? displayCurrency)}
              </p>
              {Number(payModal?.monthlyPayment) > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Suggested: {toDisplay(Number(payModal?.monthlyPayment), payModal?.currency ?? displayCurrency)}/mo
                </p>
              )}
            </div>
            <Input label="Payment amount *" type="number" min="0.01" step="0.01"
              placeholder={payModal?.monthlyPayment && Number(payModal.monthlyPayment) > 0 ? payModal.monthlyPayment : "0.00"}
              value={payAmount}
              onChange={e => { setPayAmount(e.target.value); if (errors.amount) setErrors(err => ({ ...err, amount: undefined })); }}
              error={errors.amount}
            />
            <Input label="Payment date" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
              <textarea rows={2} placeholder="e.g. Extra principal payment"
                value={payNotes} onChange={e => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            {Number(payModal?.interestRate) > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl">
                💡 Interest and principal split calculated automatically at {payModal?.interestRate}% p.a.
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