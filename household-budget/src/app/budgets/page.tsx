"use client";

import { CATEGORIES } from "@/lib/categories";
import { formatYen } from "@/lib/format";
import { setBudget, useBudgets, useHydrated } from "@/lib/store";

export default function BudgetsPage() {
  const hydrated = useHydrated();
  const budgets = useBudgets();
  if (!hydrated) return null;

  const total = Object.values(budgets).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">月間予算の設定</h1>
        <p className="mt-1 text-sm text-text-2">カテゴリごとの1か月あたりの予算です。入力すると自動で保存されます。</p>
      </div>
      <div className="card divide-y divide-border">
        {CATEGORIES.map((c) => (
          <label key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <span>
              <span className="flex items-center gap-2 font-medium">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: `var(${c.colorVar})` }} />
                {c.label}
              </span>
              <span className="mt-0.5 block text-xs text-text-2">{c.description}</span>
            </span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                className="input tabular w-36 text-right"
                value={budgets[c.id]}
                onChange={(e) => setBudget(c.id, Number(e.target.value) || 0)}
              />
              <span className="text-sm text-text-2">円</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-between px-1 text-sm">
        <span className="text-text-2">予算合計</span>
        <span className="tabular font-semibold">{formatYen(total)}</span>
      </div>
    </div>
  );
}
