"use client";

import { formatMonthLabel, shiftMonth } from "@/lib/format";

export function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="btn-secondary px-3"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="前の月"
      >
        ‹
      </button>
      <input
        type="month"
        className="input w-auto"
        value={month}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label={formatMonthLabel(month)}
      />
      <button
        type="button"
        className="btn-secondary px-3"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="次の月"
      >
        ›
      </button>
    </div>
  );
}
