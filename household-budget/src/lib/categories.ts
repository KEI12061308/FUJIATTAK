import { CATEGORY_IDS, type CategoryId } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
  /** globals.css で定義した色トークン名（ライト/ダークで切り替わる） */
  colorVar: string;
}

// 並び順はグラフの配色順（色覚多様性チェック済み）を兼ねるので変更しないこと
export const CATEGORIES: CategoryMeta[] = [
  {
    id: "food",
    label: "食費",
    description: "スーパーでの食材・飲料の購入など",
    colorVar: "--cat-food",
  },
  {
    id: "dining",
    label: "外食費",
    description: "レストラン、カフェ、居酒屋、テイクアウトなど",
    colorVar: "--cat-dining",
  },
  {
    id: "leisure",
    label: "レジャー費",
    description: "娯楽、イベント、趣味など",
    colorVar: "--cat-leisure",
  },
  {
    id: "health_beauty",
    label: "薬・コスメ費",
    description: "ドラッグストアの医薬品、化粧品など",
    colorVar: "--cat-health",
  },
  {
    id: "daily_goods",
    label: "生活雑貨費",
    description: "歯磨き、シャンプー、洗剤、100均グッズなど",
    colorVar: "--cat-daily",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && (CATEGORY_IDS as readonly string[]).includes(value);
}

export const DEFAULT_BUDGETS: Record<CategoryId, number> = {
  food: 40000,
  dining: 15000,
  leisure: 10000,
  health_beauty: 5000,
  daily_goods: 5000,
};
