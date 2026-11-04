"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { ExpenseEditor } from "@/components/ExpenseEditor";
import { MonthPicker } from "@/components/MonthPicker";
import { expensesInMonth } from "@/lib/aggregate";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { currentMonth, formatYen, newId, todayLocal } from "@/lib/format";
import { deleteExpense, exportData, importData, upsertExpense, useExpenses, useHydrated } from "@/lib/store";
import type { CategoryId, Expense } from "@/lib/types";

function newManualExpense(month: string): Expense {
  const now = new Date().toISOString();
  const today = todayLocal();
  return {
    id: newId(),
    date: today.startsWith(month) ? today : `${month}-01`,
    store: "",
    total: 0,
    items: [{ id: newId(), name: "", price: 0, category: "food" }],
    source: "manual",
    createdAt: now,
    updatedAt: now,
  };
}

function ExpensesView() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const expenses = useExpenses();
  const month = params.get("month") ?? currentMonth();
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const [editing, setEditing] = useState<Expense | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(
    () =>
      expensesInMonth(expenses, month)
        .filter((e) => filter === "all" || e.items.some((i) => i.category === filter))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [expenses, month, filter],
  );
  const listTotal = list.reduce(
    (sum, e) =>
      sum + (filter === "all" ? e.total : e.items.filter((i) => i.category === filter).reduce((s, i) => s + i.price, 0)),
    0,
  );

  const setMonth = (m: string) => router.replace(`/expenses?month=${m}`);

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kakeibo-backup-${todayLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    if (!confirm("現在のデータをバックアップの内容で置き換えます。よろしいですか？")) return;
    try {
      importData(await file.text());
    } catch {
      alert("バックアップファイルを読み込めませんでした");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">支出の履歴</h1>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      {editing ? (
        <div className="card">
          <h2 className="mb-4 text-base font-semibold">
            {expenses.some((e) => e.id === editing.id) ? "支出の編集" : "支出の手動入力"}
          </h2>
          <ExpenseEditor
            key={editing.id}
            initial={editing}
            onSave={(expense) => {
              upsertExpense(expense);
              setEditing(null);
              if (!expense.date.startsWith(month)) setMonth(expense.date.slice(0, 7));
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primary" onClick={() => setEditing(newManualExpense(month))}>
            ＋ 手動で支出を追加
          </button>
          <select
            className="input w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value as CategoryId | "all")}
            aria-label="カテゴリで絞り込み"
          >
            <option value="all">すべてのカテゴリ</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="tabular ml-auto text-sm text-text-2">
            {list.length} 件 / 合計 <span className="font-semibold text-text">{formatYen(listTotal)}</span>
          </span>
        </div>
      )}

      {list.length === 0 ? (
        <p className="card text-sm text-text-2">この月の支出はありません。</p>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onEdit={() => {
                setEditing(e);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={() => {
                if (confirm(`${e.date} ${e.store || "（店名なし）"} ${formatYen(e.total)} を削除しますか？`)) {
                  deleteExpense(e.id);
                }
              }}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4 text-sm">
        <span className="mr-2 self-center text-text-2">データ（このブラウザに保存されています）:</span>
        <button type="button" className="btn-secondary" onClick={handleExport}>
          バックアップを書き出す
        </button>
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
          バックアップから復元
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => handleImport(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

function ExpenseRow({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const cats = [...new Set(expense.items.map((i) => i.category))];

  return (
    <li className="card p-0 sm:p-0">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="tabular w-12 shrink-0 text-sm text-text-2">{expense.date.slice(5).replace("-", "/")}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{expense.store || "（店名なし）"}</span>
            <span className="mt-0.5 flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <span key={c} className="flex items-center gap-1 text-xs text-text-2">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: `var(${CATEGORY_MAP[c].colorVar})` }} />
                  {CATEGORY_MAP[c].label}
                </span>
              ))}
              <span className="rounded bg-surface-2 px-1.5 text-[10px] leading-4 text-text-2">
                {expense.source === "receipt" ? "レシート" : "手動"}
              </span>
            </span>
          </span>
          <span className="tabular shrink-0 font-semibold">{formatYen(expense.total)}</span>
        </button>
        <div className="flex gap-1.5">
          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={onEdit}>
            編集
          </button>
          <button type="button" className="btn-danger px-3 py-1.5 text-xs" onClick={onDelete}>
            削除
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border px-4 py-3">
          <table className="w-full text-sm">
            <tbody>
              {expense.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-1">{i.name}</td>
                  <td className="py-1 text-xs text-text-2">{CATEGORY_MAP[i.category].label}</td>
                  <td className="tabular py-1 text-right">{formatYen(i.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {expense.memo && <p className="mt-2 text-xs text-text-2">メモ: {expense.memo}</p>}
        </div>
      )}
    </li>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesView />
    </Suspense>
  );
}
