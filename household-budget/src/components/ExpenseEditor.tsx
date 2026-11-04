"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { guessCategory } from "@/lib/categorize";
import { formatYen, newId } from "@/lib/format";
import type { CategoryId, Expense } from "@/lib/types";

interface ItemDraft {
  id: string;
  name: string;
  price: string;
  category: CategoryId;
  /** ユーザーがカテゴリを手で選んでいなければ、品目名から自動推定し直す */
  autoCategory: boolean;
}

function toDrafts(expense: Expense, autoCategory: boolean): ItemDraft[] {
  return expense.items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price === 0 && !i.name ? "" : String(i.price),
    category: i.category,
    autoCategory,
  }));
}

const parsePrice = (s: string) => {
  const n = Number(s.replace(/[,，円¥\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : NaN;
};

/**
 * 差額を品目金額に比例して按分する（端数は最も高い品目で吸収）。
 * 全体値引き・外税の端数などで品目合計と支払合計がずれた場合に使う。
 */
function distributeDifference(items: ItemDraft[], target: number): ItemDraft[] {
  const prices = items.map((i) => parsePrice(i.price) || 0);
  const sum = prices.reduce((a, b) => a + b, 0);
  if (sum <= 0) return items;
  const adjusted = prices.map((p) => Math.round((p * target) / sum));
  const drift = target - adjusted.reduce((a, b) => a + b, 0);
  const maxIdx = prices.indexOf(Math.max(...prices));
  adjusted[maxIdx] += drift;
  return items.map((item, idx) => ({ ...item, price: String(adjusted[idx]) }));
}

export function ExpenseEditor({
  initial,
  receiptTotal,
  previewUrl,
  onSave,
  onCancel,
  saveLabel = "保存",
}: {
  initial: Expense;
  /** レシートに印字された支払合計（AI 読み取り値）。品目合計との差を警告するのに使う */
  receiptTotal?: number | null;
  previewUrl?: string;
  onSave: (expense: Expense) => void;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [date, setDate] = useState(initial.date);
  const [store, setStore] = useState(initial.store);
  const [memo, setMemo] = useState(initial.memo ?? "");
  // 新規の手動入力のみ自動推定を有効にする（AI の分類や保存済みの分類は尊重）
  const [items, setItems] = useState<ItemDraft[]>(() =>
    toDrafts(initial, initial.source === "manual" && initial.items.every((i) => !i.name)),
  );
  const [error, setError] = useState<string | null>(null);

  const itemsSum = useMemo(
    () => items.reduce((sum, i) => sum + (parsePrice(i.price) || 0), 0),
    [items],
  );
  const categorySums = useMemo(() => {
    const sums = new Map<CategoryId, number>();
    for (const i of items) sums.set(i.category, (sums.get(i.category) ?? 0) + (parsePrice(i.price) || 0));
    return sums;
  }, [items]);
  const mismatch = receiptTotal != null && itemsSum !== receiptTotal ? receiptTotal - itemsSum : 0;

  const updateItem = (id: string, patch: Partial<ItemDraft>) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, ...patch };
        if (patch.name !== undefined && next.autoCategory) {
          next.category = guessCategory(next.name, store);
        }
        return next;
      }),
    );

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: newId(), name: "", price: "", category: guessCategory("", store), autoCategory: true },
    ]);

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const applyCategoryToAll = (category: CategoryId) =>
    setItems((prev) => prev.map((i) => ({ ...i, category, autoCategory: false })));

  const handleStoreChange = (value: string) => {
    setStore(value);
    // 店名から推定できる場合、未調整の品目のカテゴリも追従させる
    setItems((prev) =>
      prev.map((i) => (i.autoCategory ? { ...i, category: guessCategory(i.name, value) } : i)),
    );
  };

  const handleSave = () => {
    setError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("日付を入力してください");
    if (items.length === 0) return setError("品目を1つ以上入力してください");
    const parsed = items.map((i) => ({ ...i, priceNum: parsePrice(i.price) }));
    if (parsed.some((i) => Number.isNaN(i.priceNum))) return setError("金額が数値になっていない品目があります");
    onSave({
      ...initial,
      date,
      store: store.trim(),
      memo: memo.trim() || undefined,
      items: parsed.map((i) => ({
        id: i.id,
        name: i.name.trim() || "（品目名なし）",
        price: i.priceNum,
        category: i.category,
      })),
      total: parsed.reduce((sum, i) => sum + i.priceNum, 0),
    });
  };

  return (
    <div className={previewUrl ? "grid gap-5 lg:grid-cols-[280px_1fr]" : ""}>
      {previewUrl && (
        <div className="lg:sticky lg:top-20 lg:self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="アップロードしたレシート"
            className="max-h-[70vh] w-full rounded-lg border border-border object-contain"
          />
        </div>
      )}

      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <label className="block text-sm">
            <span className="mb-1 block text-text-2">日付</span>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-text-2">店名</span>
            <input
              className="input"
              value={store}
              onChange={(e) => handleStoreChange(e.target.value)}
              placeholder="例: イオン ○○店"
            />
          </label>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">品目</h3>
            <label className="flex items-center gap-2 text-xs text-text-2">
              一括でカテゴリ変更
              <select
                className="input w-auto py-1 text-xs"
                value=""
                onChange={(e) => e.target.value && applyCategoryToAll(e.target.value as CategoryId)}
              >
                <option value="">選択…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[1fr_96px_auto] items-center gap-2 sm:grid-cols-[1fr_110px_150px_auto]"
              >
                <input
                  className="input col-span-3 sm:col-span-1"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder="品目名"
                  aria-label="品目名"
                />
                <input
                  className="input tabular text-right"
                  inputMode="numeric"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, { price: e.target.value })}
                  placeholder="金額"
                  aria-label="金額（円）"
                />
                <select
                  className="input"
                  value={item.category}
                  onChange={(e) =>
                    updateItem(item.id, { category: e.target.value as CategoryId, autoCategory: false })
                  }
                  aria-label="カテゴリ"
                  style={{ borderLeft: `4px solid var(${CATEGORIES.find((c) => c.id === item.category)!.colorVar})` }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary px-3 text-text-2"
                  onClick={() => removeItem(item.id)}
                  aria-label="品目を削除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-secondary mt-2" onClick={addItem}>
            ＋ 品目を追加
          </button>
        </div>

        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <div className="flex justify-between font-semibold">
            <span>品目合計</span>
            <span className="tabular">{formatYen(itemsSum)}</span>
          </div>
          {receiptTotal != null && (
            <div className="mt-1 flex justify-between text-text-2">
              <span>レシート記載の合計</span>
              <span className="tabular">{formatYen(receiptTotal)}</span>
            </div>
          )}
          {mismatch !== 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/60 bg-surface px-3 py-2 text-xs">
              <span>
                ▲ 品目合計とレシート合計に {formatYen(Math.abs(mismatch))} の差があります（値引き・税・読み取りミスの可能性）
              </span>
              <button
                type="button"
                className="btn-secondary px-2 py-1 text-xs"
                onClick={() => setItems((prev) => distributeDifference(prev, receiptTotal!))}
              >
                差額を按分して合わせる
              </button>
            </div>
          )}
          {categorySums.size > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-2">
              {CATEGORIES.filter((c) => categorySums.has(c.id)).map((c) => (
                <span key={c.id} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: `var(${c.colorVar})` }} />
                  {c.label} <span className="tabular">{formatYen(categorySums.get(c.id)!)}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-text-2">メモ（任意）</span>
          <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>

        {error && <p className="text-sm text-critical">{error}</p>}

        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={handleSave}>
            {saveLabel}
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              キャンセル
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
