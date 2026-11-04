"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyRow } from "@/lib/aggregate";
import { CATEGORIES } from "@/lib/categories";
import { useThemeColors } from "../useThemeColors";
import { ChartTooltip } from "./ChartTooltip";

const compactYen = (v: number) => (v >= 10000 ? `${v / 10000}万` : v.toLocaleString("ja-JP"));

/** 日別支出（カテゴリ積み上げ棒グラフ） */
export function DailyStackedBar({ rows }: { rows: DailyRow[] }) {
  const colors = useThemeColors();

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-2">
        {CATEGORIES.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: `var(${c.colorVar})` }} />
            {c.label}
          </span>
        ))}
      </div>
      <div className="h-56">
        {colors && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} barCategoryGap="20%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                tick={{ fill: colors.text2, fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={8}
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
                content={<ChartTooltip hideZero labelFormat={(day) => `${day}日`} />}
              />
              {CATEGORIES.map((c) => (
                <Bar
                  key={c.id}
                  dataKey={c.id}
                  name={c.label}
                  stackId="day"
                  fill={colors.category[c.id]}
                  stroke={colors.surface}
                  strokeWidth={1}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
