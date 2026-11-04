"use client";

import { useSyncExternalStore } from "react";
import { CATEGORY_IDS, type Budgets, type CategoryId, type Expense } from "./types";
import { DEFAULT_BUDGETS, isCategoryId } from "./categories";

/**
 * LocalStorage を使ったデータ保存。
 * プライベート利用前提のため、データはこのブラウザ内にのみ保存される。
 * 将来 SQLite / Supabase に移す場合はこのモジュールの中身だけ差し替える。
 */

const STORAGE_KEY = "kakeibo:v1";

interface StoreData {
  expenses: Expense[];
  budgets: Budgets;
}

const EMPTY: StoreData = { expenses: [], budgets: DEFAULT_BUDGETS };

let cache: StoreData | null = null;
const listeners = new Set<() => void>();

function load(): StoreData {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? normalize(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function normalize(data: unknown): StoreData {
  const d = (data ?? {}) as Partial<StoreData>;
  const budgets = { ...DEFAULT_BUDGETS };
  for (const id of CATEGORY_IDS) {
    const v = d.budgets?.[id];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) budgets[id] = v;
  }
  const expenses = Array.isArray(d.expenses)
    ? d.expenses.filter(
        (e): e is Expense =>
          !!e &&
          typeof e.id === "string" &&
          typeof e.date === "string" &&
          Array.isArray(e.items) &&
          e.items.every((i) => isCategoryId(i?.category)),
      )
    : [];
  return { expenses, budgets };
}

function save(next: StoreData) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.error("LocalStorage への保存に失敗しました", err);
    alert("データの保存に失敗しました。ブラウザのストレージ容量を確認してください。");
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    // 別タブでの変更を反映
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function useStore(): StoreData {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

/** サーバーレンダリング中は false。LocalStorage 読み込み前の空表示を避けるのに使う */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useExpenses(): Expense[] {
  return useStore().expenses;
}

export function useBudgets(): Budgets {
  return useStore().budgets;
}

function withTotal(expense: Expense): Expense {
  return { ...expense, total: expense.items.reduce((sum, i) => sum + i.price, 0) };
}

export function upsertExpense(expense: Expense) {
  const data = load();
  const now = new Date().toISOString();
  const next = withTotal({ ...expense, updatedAt: now });
  const exists = data.expenses.some((e) => e.id === expense.id);
  const expenses = exists
    ? data.expenses.map((e) => (e.id === expense.id ? next : e))
    : [...data.expenses, { ...next, createdAt: now }];
  save({ ...data, expenses });
}

export function deleteExpense(id: string) {
  const data = load();
  save({ ...data, expenses: data.expenses.filter((e) => e.id !== id) });
}

export function setBudget(category: CategoryId, amount: number) {
  const data = load();
  save({ ...data, budgets: { ...data.budgets, [category]: Math.max(0, Math.round(amount)) } });
}

export function exportData(): string {
  return JSON.stringify(load(), null, 2);
}

export function importData(json: string) {
  save(normalize(JSON.parse(json)));
}
