"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORIES } from "@/lib/categories";
import { formatYen } from "@/lib/format";
import type { CategoryId } from "@/lib/types";
import { useThemeColors } from "../useThemeColors";
import { ChartTooltip } from "./ChartTooltip";

/** カテゴリ別の支出割合（ドーナツ）＋ 金額・割合の一覧（色だけに頼らない凡例兼テーブル） */
export function CategoryDonut({ totals }: { totals: Record<CategoryId, number> }) {
  const colors = useThemeColors();
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  const data = CATEGORIES.map((c) => ({ id: c.id, name: c.label, value: totals[c.id] }));
  const pct = (v: number) => (sum > 0 ? Math.round((v / sum) * 100) : 0);

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
      <div className="relative mx-auto h-[200px] w-[200px]">
        {colors && sum > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.filter((d) => d.value > 0)}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={0}
                stroke={colors.surface}
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {data
                  .filter((d) => d.value > 0)
                  .map((d) => (
                    <Cell key={d.id} fill={colors.category[d.id]} />
                  ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltip
                    format={(name, value) => `${name}  ${formatYen(value)}（${pct(value)}%）`}
                    colorOf={(p) => colors.category[p.payload?.id as CategoryId]}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-full border-[30px] border-surface-2" />
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-text-2">合計</span>
          <span className="tabular text-lg font-bold">{formatYen(sum)}</span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>カテゴリ</th>
            <th>金額</th>
            <th>割合</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} className="border-b border-border last:border-0">
              <td className="py-2">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-sm"
                    style={{ background: `var(${CATEGORIES.find((c) => c.id === d.id)!.colorVar})` }}
                  />
                  {d.name}
                </span>
              </td>
              <td className="tabular py-2 text-right font-medium">{formatYen(d.value)}</td>
              <td className="tabular w-14 py-2 text-right text-text-2">{pct(d.value)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
