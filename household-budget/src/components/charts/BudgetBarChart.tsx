"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES } from "@/lib/categories";
import { formatYen } from "@/lib/format";
import type { Budgets, CategoryId } from "@/lib/types";
import { useThemeColors } from "../useThemeColors";
import { ChartTooltip } from "./ChartTooltip";

const compactYen = (v: number) => (v >= 10000 ? `${v / 10000}万` : v.toLocaleString("ja-JP"));

/** カテゴリ別「予算 vs 実績」の棒グラフ */
export function BudgetBarChart({
  totals,
  budgets,
}: {
  totals: Record<CategoryId, number>;
  budgets: Budgets;
}) {
  const colors = useThemeColors();
  const data = CATEGORIES.map((c) => ({
    id: c.id,
    name: c.label,
    budget: budgets[c.id],
    actual: totals[c.id],
  }));

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-text-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--budget)" }} />
          予算
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex">
            {CATEGORIES.map((c) => (
              <span key={c.id} className="inline-block h-2.5 w-1" style={{ background: `var(${c.colorVar})` }} />
            ))}
          </span>
          実績（カテゴリ色）
        </span>
      </div>
      <div className="h-64">
        {colors && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="24%" maxBarSize={44} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                tick={{ fill: colors.text2, fontSize: 12 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: colors.text2, fontSize: 12 }}
                tickFormatter={compactYen}
                width={48}
              />
              <Tooltip
                cursor={{ fill: colors.grid, opacity: 0.4 }}
                content={
                  <ChartTooltip
                    format={(name, value) => `${name}  ${formatYen(value)}`}
                    colorOf={(p) =>
                      p.name === "予算" ? colors.budget : colors.category[p.payload?.id as CategoryId]
                    }
                  />
                }
              />
              <Bar dataKey="budget" name="予算" fill={colors.budget} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="actual" name="実績" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.id} fill={colors.category[d.id]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
