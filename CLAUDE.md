# ふたりの家計簿（FUJIATTAK）

@AGENTS.md

## 目的
同じ世帯の2人がスマホだけで使う家計簿 Web アプリ（PWA）。レシートを撮影すると Claude API が品目を抽出・分類し、確認後に保存する。

## 前提
- 利用者は2人（同じ世帯）。端末はスマホのみ（幅 375px 基準）。
- 開発者（オーナー）はコードを書かず、PC・ターミナルも使わない。外部サービスの操作は「スマホのブラウザで、どの画面の、どこを押すか」で案内する。
- 動作確認は Vercel の公開 URL（プレビュー／本番）で行う。localhost 前提の説明はしない。
- 月の区切りは毎月1日〜末日。日付計算は常に Asia/Tokyo。
- 金額はすべて整数（円）。税込・値引き後。ポイント／クーポン払いも支出に含める。

## 技術構成
- Next.js 16（App Router, `cacheComponents` 有効）＋ TypeScript ＋ Tailwind CSS v4
  - Next.js のコードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読む（AGENTS.md 参照）。
  - セッション（cookie）を読む部分は `<Suspense>` の内側に置く。
- Supabase（Postgres / Auth / Storage）。スキーマは `supabase/migrations/*.sql` で管理し、SQL Editor に貼って適用する。
- Vercel（GitHub 連携で自動デプロイ）
- Claude API（`@anthropic-ai/sdk`）で画像からレシートを構造化抽出。サーバー側のみで呼ぶ。
- Zod（入力検証）、Recharts（グラフ）、Vitest（テスト）

## 開発コマンド（Claude Code の実行環境で使う）
- `npm test` … Vitest
- `npm run typecheck` … ルート型生成 ＋ tsc
- `npm run lint` … ESLint
- `npm run build` … 本番ビルド

## 環境変数
| 名前 | 用途 | 公開 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | 公開可 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable key（旧 anon key） | 公開可 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secret key（旧 service_role）。招待受諾などサーバー処理のみ | 秘密 |
| `ANTHROPIC_API_KEY` | Claude API キー。サーバー側のみ | 秘密 |
| `ANTHROPIC_MODEL` | レシート解析に使うモデル ID。初期値 `claude-opus-5-5` | 非秘密 |

- 秘密情報はリポジトリに含めない（`.env*` は gitignore 済み。見本は `.env.example`）。
- 未設定の変数はトップ画面に「未設定」と表示する（`src/lib/env.ts`）。

## 設計判断（決定済み）
- データは世帯（household）単位で共有。RLS で自世帯以外は読み書き不可。
- ログインはメール＋パスワード。一般の新規登録は無効。パートナーは招待リンク（LINE 等で送る）から登録。メール送信には依存しない。
- カテゴリは品目単位。5カテゴリ（食費／外食費／レジャー費／薬・コスメ費／その他生活雑貨費）のみで運用（変動費専用）。カテゴリは世帯ごとのテーブルで拡張可能な構造。
- メンバー別表示では金額のみ切り替え、予算バーは世帯合計のまま。
- 整合性チェック：差額が「品目数×1円」以内なら「最大の品目で吸収」を初期選択として提示（必ず確認を通す）。「調整」品目のカテゴリ初期値はレシート内で最大金額のカテゴリ。
- 立替の精算機能は作らない（2人の支払額比較グラフのみ）。
- 同時編集は後勝ち。削除済みレシートの編集はエラー。
- 論理削除（`deleted_at`）、30日後に物理削除。
- 旧 `index.html`（富士のページ）は `legacy/` に退避。
- 運用：フェーズごとに `claude/household-budget-app-nqvv3y` から main へ PR。オーナーの OK 後に Claude がマージする。

## フェーズ
0 計画 ✅ / 1 外部サービス準備（進行中） / 2 土台（DB・RLS・ログイン・招待・手入力・履歴・PWA） / 3 レシート解析 / 4 ダッシュボード / 5 仕上げ
