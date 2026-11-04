export const CATEGORY_IDS = [
  "food",
  "dining",
  "leisure",
  "health_beauty",
  "daily_goods",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface ExpenseItem {
  id: string;
  name: string;
  /** 税込・値引き後の金額（円） */
  price: number;
  category: CategoryId;
}

export interface Expense {
  id: string;
  /** YYYY-MM-DD（ローカル日付） */
  date: string;
  store: string;
  /** 品目金額の合計（円）。保存時に items から再計算する */
  total: number;
  items: ExpenseItem[];
  source: "receipt" | "manual";
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type Budgets = Record<CategoryId, number>;

/** レシート解析 API のレスポンス */
export interface ReceiptAnalysis {
  date: string | null;
  store: string;
  total: number | null;
  items: { name: string; price: number; category: CategoryId }[];
}
