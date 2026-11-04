import type { CategoryId } from "./types";

/**
 * 手動入力時の自動分類（キーワードルール）。
 * レシート解析では Claude が分類するため、ここは AI を使わない場面の補助。
 */
const STORE_RULES: [RegExp, CategoryId][] = [
  [/ドラッグ|薬局|マツキヨ|マツモトキヨシ|ウエルシア|ツルハ|サンドラッグ|スギ薬局|ココカラ|コスメ/i, "health_beauty"],
  [/ダイソー|セリア|キャンドゥ|ニトリ|無印|ホームセンター|カインズ|コーナン|ロフト|ハンズ/i, "daily_goods"],
  [/レストラン|カフェ|喫茶|居酒屋|食堂|ラーメン|寿司|すし|焼肉|マクドナルド|マック|スタバ|スターバックス|ドトール|タリーズ|コメダ|サイゼリヤ|ガスト|吉野家|すき家|松屋|ケンタッキー|モス|bar|bistro|cafe|coffee/i, "dining"],
  [/映画|シネマ|カラオケ|ボウリング|遊園地|ランド|動物園|水族館|美術館|博物館|チケット|ゲーム|書店|本屋|ジム|温泉|スパ/i, "leisure"],
  [/スーパー|イオン|イトーヨーカドー|西友|ライフ|マルエツ|サミット|オーケー|業務スーパー|コープ|生協|成城石井|まいばすけっと|ローソン|セブン|ファミリーマート|ファミマ/i, "food"],
];

const ITEM_RULES: [RegExp, CategoryId][] = [
  [/薬|錠|カプセル|目薬|湿布|絆創膏|マスク|サプリ|ビタミン|化粧|ファンデ|リップ|口紅|乳液|化粧水|美容液|日焼け止め|コスメ|アイシャドウ|マスカラ/i, "health_beauty"],
  [/歯磨|歯ブラシ|シャンプー|リンス|コンディショナー|ソープ|石鹸|せっけん|洗剤|柔軟剤|ティッシュ|トイレット|キッチンペーパー|ラップ|ゴミ袋|スポンジ|電池|ハンガー|収納/i, "daily_goods"],
  [/チケット|入場|入館|観覧|映画|カラオケ|ゲーム|本|雑誌|コミック/i, "leisure"],
  [/ランチ|ディナー|定食|コース|セット|ドリンクバー|生ビール|ハイボール|お通し/i, "dining"],
];

export function guessCategory(itemName: string, storeName = ""): CategoryId {
  for (const [re, cat] of ITEM_RULES) if (re.test(itemName)) return cat;
  for (const [re, cat] of STORE_RULES) if (re.test(storeName)) return cat;
  return "food";
}
