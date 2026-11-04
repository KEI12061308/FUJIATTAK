# 家計簿（レシート読み取り対応）

プライベート用の生活費管理 Web アプリです。レシート写真を Claude API で解析し、品目ごとに 5 つの変動費カテゴリへ自動分類、月間予算の進捗をダッシュボードで確認できます。

## 技術スタック

| 用途 | 採用技術 |
|---|---|
| フレームワーク | Next.js 16（App Router）+ React 19 + TypeScript |
| スタイリング | Tailwind CSS v4（ライト / ダーク対応） |
| グラフ | Recharts |
| データ保存 | LocalStorage（ブラウザ内のみ。JSON バックアップ / 復元あり） |
| レシート解析 | Claude API（`claude-opus-5-5`、画像入力 + Structured Outputs） |

## セットアップ

```bash
cd household-budget
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY を設定
npm run dev                  # http://localhost:3000
```

API キーがなくても、手動入力・ダッシュボード・予算管理は使えます（レシート読み取りのみエラーになります）。

## 機能

- **レシート読み取り**（`/receipts`）: JPEG / PNG / WebP / GIF をアップロード（スマホではカメラ撮影も可）。購入日・店名・合計・品目と金額を抽出し、品目ごとにカテゴリを自動判定。保存前に確認画面で修正できます。
  - 品目合計とレシート記載合計がずれた場合（全体値引き・税の端数など）は警告を表示し、「差額を按分」で合わせられます。
- **カテゴリ分類**: 食費 / 外食費 / レジャー費 / 薬・コスメ費 / 生活雑貨費。1 枚のレシートで品目ごとに別カテゴリにでき（例: ドラッグストアの薬と洗剤）、一括変更もできます。手動入力時はキーワードルールで推定します。
- **ダッシュボード**（`/`）: 月別の総支出・残り予算・消化率、カテゴリ別ドーナツグラフ、予算 vs 実績の棒グラフ、カテゴリ別の予算プログレスバー（80% で「注意」、100% 超で「超過」）、日別の積み上げ棒グラフ。
- **履歴・入力**（`/expenses`）: 月別一覧、カテゴリ絞り込み、編集・削除、レシートなしの手動入力、JSON バックアップの書き出し / 復元。
- **予算設定**（`/budgets`）: カテゴリごとの月間予算。

## プロジェクト構成

```
src/
├── app/
│   ├── api/receipt/route.ts   # レシート解析 API（Claude 呼び出し）
│   ├── page.tsx               # ダッシュボード
│   ├── receipts/page.tsx      # アップロード → 解析 → 確認・保存
│   ├── expenses/page.tsx      # 履歴・編集・削除・手動入力・バックアップ
│   ├── budgets/page.tsx       # 予算設定
│   ├── layout.tsx / globals.css
├── components/
│   ├── ExpenseEditor.tsx      # 支出の編集フォーム（確認・編集・手動入力で共用）
│   ├── BudgetProgress.tsx     # 予算プログレスバー
│   ├── MonthPicker.tsx / Nav.tsx / useThemeColors.ts
│   └── charts/                # CategoryDonut / BudgetBarChart / DailyStackedBar
└── lib/
    ├── types.ts / categories.ts
    ├── receipt-schema.ts      # Claude に返させる JSON の Zod スキーマ
    ├── store.ts               # LocalStorage 永続化（差し替えポイント）
    ├── aggregate.ts           # 月別・カテゴリ別・日別集計
    ├── categorize.ts          # 手動入力用のキーワード分類
    ├── image.ts               # アップロード前の縮小・JPEG 化
    └── format.ts
```

## レシート解析の仕組み

1. ブラウザで画像を長辺 2000px 以下の JPEG に縮小（EXIF の向きを反映）し、base64 で `/api/receipt` に送信。
2. サーバー側で Claude API に画像とシステムプロンプト（分類ルール・税込換算・値引きの扱い）を渡し、Structured Outputs（Zod スキーマ）で JSON を強制。
3. 安全分類器による拒否時は、サーバー側フォールバック（`fallbacks: "default"`）で自動的に別モデルが再実行。それでも拒否された場合は手動入力を案内。
4. 結果を確認画面に表示し、ユーザーが修正して保存。

API キーはサーバー側（Route Handler）でのみ使い、ブラウザには渡しません。

## 注意

- データはブラウザの LocalStorage に保存されます。ブラウザのデータ削除で消えるため、定期的に「バックアップを書き出す」を使ってください。
- `/api/receipt` には認証がありません。インターネットに公開する場合は、第三者に API を使われないよう Basic 認証などを追加してください。
- iPhone の HEIC 画像は未対応です（カメラ設定を「互換性優先」にするか、スクリーンショット等で JPEG にしてください）。

## 今後の拡張案

- SQLite / Supabase への移行（`src/lib/store.ts` の差し替えで対応可能）と端末間同期
- 月次推移グラフ、固定費の管理
- CSV 書き出し
