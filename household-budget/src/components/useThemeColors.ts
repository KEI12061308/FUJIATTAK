"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

export interface ThemeColors {
  category: Record<CategoryId, string>;
  surface: string;
  text: string;
  text2: string;
  grid: string;
  budget: string;
}

/**
 * Recharts は SVG 属性に色を渡すため CSS 変数をそのまま使えない。
 * 計算済みの値を読み取り、ライト/ダーク切り替え時にも追従する。
 */
export function useThemeColors(): ThemeColors | null {
  const [colors, setColors] = useState<ThemeColors | null>(null);

  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      const v = (name: string) => s.getPropertyValue(name).trim();
      setColors({
        category: Object.fromEntries(CATEGORIES.map((c) => [c.id, v(c.colorVar)])) as Record<
          CategoryId,
          string
        >,
        surface: v("--surface"),
        text: v("--text"),
        text2: v("--text-2"),
        grid: v("--grid"),
        budget: v("--budget"),
      });
    };
    read();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", read);
      observer.disconnect();
    };
  }, []);

  return colors;
}
