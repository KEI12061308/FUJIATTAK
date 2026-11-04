import { CATEGORY_IDS, type CategoryId, type Expense } from "./types";
import { daysInMonth } from "./format";

export function expensesInMonth(expenses: Expense[], month: string): Expense[] {
  return expenses.filter((e) => e.date.startsWith(month));
}

export function emptyTotals(): Record<CategoryId, number> {
  return Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])) as Record<CategoryId, number>;
}

/** カテゴリ別合計（1枚のレシートに複数カテゴリが混在しても品目単位で集計） */
export function totalsByCategory(expenses: Expense[]): Record<CategoryId, number> {
  const totals = emptyTotals();
  for (const e of expenses) for (const item of e.items) totals[item.category] += item.price;
  return totals;
}

export type DailyRow = { day: number } & Record<CategoryId, number>;

export function dailyTotals(expenses: Expense[], month: string): DailyRow[] {
  const rows: DailyRow[] = Array.from({ length: daysInMonth(month) }, (_, i) => ({
    day: i + 1,
    ...emptyTotals(),
  }));
  for (const e of expensesInMonth(expenses, month)) {
    const row = rows[Number(e.date.slice(8, 10)) - 1];
    if (!row) continue;
    for (const item of e.items) row[item.category] += item.price;
  }
  return rows;
}
