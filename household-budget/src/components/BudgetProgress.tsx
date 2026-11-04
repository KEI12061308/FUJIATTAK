"use client";

import { CATEGORIES } from "@/lib/categories";
import { formatYen } from "@/lib/format";
import type { Budgets, CategoryId } from "@/lib/types";

function status(rate: number) {
  if (rate > 1) return { label: "超過", icon: "!", className: "bg-critical text-white" };
  if (rate >= 0.8) return { label: "注意", icon: "▲", className: "bg-warning text-black" };
  return null;
}

/** カテゴリごとの予算消化率と残り予算 */
export function BudgetProgress({
  totals,
  budgets,
}: {
  totals: Record<CategoryId, number>;
  budgets: Budgets;
}) {
  return (
    <ul className="space-y-4">
      {CATEGORIES.map((c) => {
        const spent = totals[c.id];
        const budget = budgets[c.id];
        const rate = budget > 0 ? spent / budget : spent > 0 ? Infinity : 0;
        const remaining = budget - spent;
        const s = status(rate);
        return (
          <li key={c.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: `var(${c.colorVar})` }} />
                {c.label}
                {s && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s.className}`}>
                    {s.icon} {s.label}
                  </span>
                )}
              </span>
              <span className="tabular text-text-2">
                <span className="font-semibold text-text">{formatYen(spent)}</span> / {formatYen(budget)}
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-label={`${c.label}の予算消化率`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Number.isFinite(rate) ? Math.round(rate * 100) : 100}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Number.isFinite(rate) ? rate * 100 : 100)}%`,
                  background: rate > 1 ? "var(--critical)" : `var(${c.colorVar})`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-text-2">
              <span className="tabular">
                消化率 {Number.isFinite(rate) ? `${Math.round(rate * 100)}%` : "—"}
              </span>
              <span className={`tabular ${remaining < 0 ? "font-semibold text-critical" : ""}`}>
                {remaining >= 0 ? `残り ${formatYen(remaining)}` : `${formatYen(-remaining)} 超過`}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
