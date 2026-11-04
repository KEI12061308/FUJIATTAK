"use client";

import { formatYen } from "@/lib/format";

interface Payload {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

/** Recharts 用の共通ツールチップ（テキストは常に文字色、色はマーカーのみ） */
export function ChartTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
  colorOf,
  hideZero,
}: {
  active?: boolean;
  payload?: Payload[];
  label?: string | number;
  format?: (name: string, value: number) => string;
  labelFormat?: (label: string | number) => string;
  /** マーカー色を明示したい場合（Cell で色分けしたバー等） */
  colorOf?: (entry: Payload) => string | undefined;
  hideZero?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => !hideZero || Number(p.value) > 0);
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      {label !== undefined && label !== "" && <div className="mb-1 font-semibold">{labelFormat ? labelFormat(label) : label}</div>}
      {rows.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: colorOf?.(p) ?? p.color }}
          />
          <span className="tabular">
            {format
              ? format(String(p.name ?? ""), Number(p.value))
              : `${p.name}  ${formatYen(Number(p.value))}`}
          </span>
        </div>
      ))}
    </div>
  );
}
