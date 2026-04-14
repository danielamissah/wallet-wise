// src/app/dashboard/rules/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRules } from "@/hooks/useRules";
import type { BudgetRule, RuleCalculation } from "@/hooks/useRules";
import { formatCurrency, getPreferredCurrency, cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageTransition from "@/components/ui/PageTransition";
import {
  Plus, Trash2, Pencil, Calculator,
  GripVertical, ToggleLeft, ToggleRight,
} from "lucide-react";

interface RuleForm {
  name: string; category: string; ruleType: "percentage" | "fixed";
  ruleBase: "gross_income" | "net_income" | "custom";
  value: string; currency: string; priority: string; description: string;
}

interface FormErrors { name?: string; value?: string; }

const EMPTY_RULE: RuleForm = {
  name: "", category: "", ruleType: "percentage",
  ruleBase: "gross_income", value: "", currency: "USD",
  priority: "0", description: "",
};

const PRESET_RULES = [
  { name: "Tithe",       value: "10", ruleType: "percentage", ruleBase: "gross_income", description: "10% of gross income" },
  { name: "Savings",     value: "20", ruleType: "percentage", ruleBase: "gross_income", description: "20% savings rule"    },
  { name: "Emergency fund", value: "5", ruleType: "percentage", ruleBase: "gross_income", description: "5% emergency fund" },
];

export default function RulesPage() {
  const { rules, loading, refetch, calculate } = useRules();

  const [modal,       setModal]       = useState<null | "add" | BudgetRule>(null);
  const [form,        setForm]        = useState<RuleForm>(EMPTY_RULE);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [calcModal,   setCalcModal]   = useState(false);
  const [grossInput,  setGrossInput]  = useState("");
  const [netInput,    setNetInput]    = useState("");
  const [calcResult,  setCalcResult]  = useState<RuleCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);

  function openAdd(preset?: typeof PRESET_RULES[0]) {
    const preferred = getPreferredCurrency();
    if (preset) {
      setForm({
        ...EMPTY_RULE,
        name:        preset.name,
        category:    preset.name,
        ruleType:    preset.ruleType as "percentage" | "fixed",
        ruleBase:    preset.ruleBase as RuleForm["ruleBase"],
        value:       preset.value,
        currency:    preferred,
        priority:    String(rules.length),
        description: preset.description,
      });
    } else {
      setForm({ ...EMPTY_RULE, currency: preferred, priority: String(rules.length) });
    }
    setErrors({});
    setModal("add");
  }

  function openEdit(rule: BudgetRule) {
    setForm({
      name:        rule.name,
      category:    rule.category,
      ruleType:    rule.ruleType,
      ruleBase:    rule.ruleBase,
      value:       rule.value,
      currency:    rule.currency,
      priority:    String(rule.priority),
      description: rule.description ?? "",
    });
    setErrors({});
    setModal(rule);
  }

  function setField<K extends keyof RuleForm>(k: K, v: RuleForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof FormErrors]) setErrors(e => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())              e.name  = "Please enter a rule name.";
    if (!form.value || Number(form.value) <= 0) e.value = "Please enter a valid value.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        category:    form.category.trim() || form.name.trim(),
        ruleType:    form.ruleType,
        ruleBase:    form.ruleBase,
        value:       Number(form.value),
        currency:    form.currency,
        priority:    Number(form.priority),
        description: form.description.trim() || null,
      };
      if (modal === "add") {
        await fetch("/api/rules", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (typeof modal === "object" && modal !== null) {
        await fetch(`/api/rules/${modal.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await refetch();
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget rule?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/rules/${id}`, { method: "DELETE" });
      refetch();
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(rule: BudgetRule) {
    await fetch(`/api/rules/${rule.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
    refetch();
  }

  async function handleCalculate() {
    if (!grossInput || Number(grossInput) <= 0) return;
    setCalculating(true);
    const result = await calculate(
      Number(grossInput),
      netInput ? Number(netInput) : undefined
    );
    setCalcResult(result);
    setCalculating(false);
  }

  const active = rules.filter(r => r.active);

  const BASE_LABELS: Record<string, string> = {
    gross_income: "Gross income",
    net_income:   "Net income",
    custom:       "Custom base",
  };

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Budget rules</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              Set automatic allocations — tithe, savings, rent — applied to your income
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => { setCalcModal(true); setCalcResult(null); setGrossInput(""); setNetInput(""); }}
              className="justify-center"
            >
              <Calculator className="w-4 h-4" /> Calculate
            </Button>
            <Button onClick={() => openAdd()} className="justify-center">
              <Plus className="w-4 h-4" /> Add rule
            </Button>
          </div>
        </div>

        {/* Quick-add presets */}
        {rules.length === 0 && !loading && (
          <Card>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Quick start with common rules
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_RULES.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => openAdd(preset)}
                  className="flex flex-col items-start p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{preset.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{preset.description}</p>
                  <span className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    {preset.value}% of {preset.ruleBase === "gross_income" ? "gross" : "net"}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Rules list */}
        {!loading && rules.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Rules (applied in priority order — drag to reorder)
            </p>
            {rules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(!rule.active && "opacity-50")}
              >
                <Card>
                  <div className="flex items-start gap-3">
                    {/* Drag handle */}
                    <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0 cursor-grab" />

                    {/* Priority badge */}
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                        {rule.priority + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{rule.name}</p>
                        {!rule.active && (
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {rule.ruleType === "percentage"
                          ? `${rule.value}% of ${BASE_LABELS[rule.ruleBase]}`
                          : `${formatCurrency(Number(rule.value), rule.currency)} fixed`
                        }
                        {rule.description && ` · ${rule.description}`}
                      </p>
                    </div>

                    {/* Value badge */}
                    <div className="shrink-0">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-xl">
                        {rule.ruleType === "percentage"
                          ? `${rule.value}%`
                          : formatCurrency(Number(rule.value), rule.currency)
                        }
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title={rule.active ? "Pause rule" : "Activate rule"}
                      >
                        {rule.active
                          ? <ToggleRight className="w-4 h-4 text-green-500" />
                          : <ToggleLeft  className="w-4 h-4 text-gray-400"  />
                        }
                      </button>
                      <button onClick={() => openEdit(rule)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} disabled={deleting === rule.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors disabled:opacity-40">
                        {deleting === rule.id
                          ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add preset button when rules exist */}
        {rules.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_RULES.filter(p => !rules.find(r => r.name.toLowerCase() === p.name.toLowerCase())).map(preset => (
              <button key={preset.name} onClick={() => openAdd(preset)}
                className="flex items-center gap-2 p-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left">
                <Plus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{preset.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{preset.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Add / Edit modal */}
        <Modal
          open={modal !== null}
          onClose={() => setModal(null)}
          title={modal === "add" ? "Add budget rule" : "Edit budget rule"}
        >
          <div className="space-y-4">
            <Input
              label="Rule name *"
              placeholder="Tithe, Savings, Rent…"
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              error={errors.name}
            />

            {/* Percentage / Fixed toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Rule type</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {(["percentage", "fixed"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setField("ruleType", t)}
                    className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                      form.ruleType === t
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}>
                    {t === "percentage" ? "% Percentage" : "Fixed amount"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={form.ruleType === "percentage" ? "Percentage *" : "Amount *"}
                type="number" min="0.01" step="0.01"
                placeholder={form.ruleType === "percentage" ? "10" : "500"}
                value={form.value}
                onChange={e => setField("value", e.target.value)}
                error={errors.value}
              />
              {form.ruleType === "fixed" ? (
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={e => setField("currency", e.target.value)}
                  options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
                />
              ) : (
                <Select
                  label="Calculate from"
                  value={form.ruleBase}
                  onChange={e => setField("ruleBase", e.target.value as RuleForm["ruleBase"])}
                  options={[
                    { value: "gross_income", label: "Gross income" },
                    { value: "net_income",   label: "Net income"   },
                  ]}
                />
              )}
            </div>

            <Input
              label="Priority (lower = applied first)"
              type="number" min="0" step="1" placeholder="0"
              value={form.priority}
              onChange={e => setField("priority", e.target.value)}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
              Example: Tithe priority 1, Savings priority 2 — tithe is deducted from income first.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
              <input type="text" placeholder="e.g. 10% of gross income before savings"
                value={form.description} onChange={e => setField("description", e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {modal === "add" ? "Add rule" : "Save changes"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Calculate modal */}
        <Modal open={calcModal} onClose={() => setCalcModal(false)} title="Income breakdown calculator">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your income to see how your budget rules allocate it.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Gross income *"
                type="number" min="0" step="0.01" placeholder="5000"
                value={grossInput}
                onChange={e => { setGrossInput(e.target.value); setCalcResult(null); }}
              />
              <Input
                label="Net income (optional)"
                type="number" min="0" step="0.01" placeholder="4000"
                value={netInput}
                onChange={e => { setNetInput(e.target.value); setCalcResult(null); }}
              />
            </div>
            <Button onClick={handleCalculate} loading={calculating} className="w-full justify-center">
              <Calculator className="w-4 h-4" /> Calculate breakdown
            </Button>

            {/* Results */}
            <AnimatePresence>
              {calcResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-2"
                >
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Breakdown
                  </p>

                  {/* Stacked bar */}
                  <div className="h-3 rounded-full overflow-hidden flex">
                    {calcResult.breakdown.map((item, i) => {
                      const colors = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ef4444","#ec4899","#14b8a6"];
                      return (
                        <div key={item.ruleId}
                          style={{ width: `${item.percentage}%`, background: colors[i % colors.length] }}
                          title={`${item.name}: ${item.percentage}%`}
                        />
                      );
                    })}
                    {/* Free cash */}
                    <div style={{ width: `${calcResult.freeCashPct}%`, background: "#e5e7eb" }}
                      title={`Free cash: ${calcResult.freeCashPct}%`} />
                  </div>

                  {/* Row per rule */}
                  <div className="space-y-2">
                    {calcResult.breakdown.map((item, i) => {
                      const colors = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ef4444","#ec4899","#14b8a6"];
                      return (
                        <div key={item.ruleId} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {item.ruleType === "percentage" ? `${item.value}%` : "Fixed"} · {item.percentage}% of gross
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.allocated)}
                          </p>
                        </div>
                      );
                    })}

                    {/* Free cash row */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400">Free cash</p>
                          <p className="text-xs text-green-600 dark:text-green-500">{calcResult.freeCashPct}% of gross</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(calcResult.freeCash)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Modal>

      </div>
    </PageTransition>
  );
}