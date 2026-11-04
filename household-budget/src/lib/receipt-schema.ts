import * as z from "zod/v4";
import { CATEGORY_IDS } from "./types";

/** Claude に返させるレシート解析結果の構造（Structured Outputs で強制） */
export const ReceiptSchema = z.object({
  date: z
    .string()
    .nullable()
    .describe("購入日 YYYY-MM-DD。和暦（令和）は西暦に変換。読めなければ null"),
  store: z.string().describe("店名。読めなければ空文字"),
  total: z
    .number()
    .nullable()
    .describe("レシートに印字された支払合計（税込・円）。読めなければ null"),
  items: z
    .array(
      z.object({
        name: z.string().describe("品目名（略称はわかる範囲で補ってよい）"),
        price: z
          .number()
          .describe("その品目に実際に支払った税込金額（円）。数量・値引きを反映した行の金額"),
        category: z.enum(CATEGORY_IDS).describe("変動費カテゴリ"),
      }),
    )
    .describe("購入品目。小計・合計・税・お預り・お釣り・ポイントの行は含めない"),
});

export type ReceiptOutput = z.infer<typeof ReceiptSchema>;
