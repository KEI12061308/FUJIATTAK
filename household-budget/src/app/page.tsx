"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BudgetProgress } from "@/components/BudgetProgress";
import { BudgetBarChart } from "@/components/charts/BudgetBarChart";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { DailyStackedBar } from "@/components/charts/DailyStackedBar";
import { MonthPicker } from "@/components/MonthPicker";
import { dailyTotals, expensesInMonth, totalsByCategory } from "@/lib/aggregate";
import { currentMonth, formatMonthLabel, formatYen } from "@/lib/format";
import { useBudgets, useExpenses, useHydrated } from "@/lib/store";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const expenses = useExpenses();
  const budgets = useBudgets();
  const [month, setMonth] = useState(currentMonth);

  const monthExpenses = useMemo(() => expensesInMonth(expenses, month), [expenses, month]);
  const totals = useMemo(() => totalsByCategory(monthExpenses), [monthExpenses]);
  const daily = useMemo(() => dailyTotals(expenses, month), [expenses, month]);

  const spent = Object.values(totals).reduce((a, b) => a + b, 0);
  const budgetTotal = Object.values(budgets).reduce((a, b) => a + b, 0);
  const remaining = budgetTotal - spent;
  const rate = budgetTotal > 0 ? Math.round((spent / budgetTotal) * 100) : 0;

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{formatMonthLabel(month)}の支出</h1>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="今月のサマリー">
        <Stat label="総支出" value={formatYen(spent)} />
        <Stat label="予算合計" value={formatYen(budgetTotal)} />
        <Stat
          label={remaining >= 0 ? "残り予算" : "予算超過"}
          value={formatYen(Math.abs(remaining))}
          tone={remaining < 0 ? "critical" : undefined}
        />
        <Stat label="消化率" value={`${rate}%`} sub={`${monthExpenses.length} 件の支出`} />
      </section>

      {monthExpenses.length === 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-text-2">この月の支出はまだありません。</span>
          <div className="flex gap-2">
            <Link href="/receipts" className="btn-primary">
              レシートを読み取る
            </Link>
            <Link href="/expenses" className="btn-secondary">
              手動で入力
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">カテゴリ別の内訳</h2>
          <CategoryDonut totals={totals} />
        </section>
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">予算の進捗</h2>
          <BudgetProgress totals={totals} budgets={budgets} />
          <Link href="/budgets" className="mt-4 inline-block text-xs text-accent hover:underline">
            予算を変更する →
          </Link>
        </section>
      </div>

      <section className="card">
        <h2 className="mb-3 text-base font-semibold">予算と実績</h2>
        <BudgetBarChart totals={totals} budgets={budgets} />
      </section>

      <section className="card">
        <h2 className="mb-3 text-base font-semibold">日別の支出</h2>
        <DailyStackedBar rows={daily} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "critical";
}) {
  return (
    <div className="card">
      <div className="text-xs text-text-2">{label}</div>
      <div className={`tabular mt-1 text-xl font-bold sm:text-2xl ${tone === "critical" ? "text-critical" : ""}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-text-3">{sub}</div>}
    </div>
  );
}
