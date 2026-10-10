# フェーズ1 外部サービス準備手順（スマホのブラウザだけで完結）

> APIキーなどの秘密の値は、**このチャットやGitHubには貼らないでください。** 貼る場所は Vercel の環境変数画面だけです。
> 途中で取得する値は、スマホのメモアプリに一時的に控え、Vercel に入れ終わったら消してください。

## 手順A：GitHubリポジトリを非公開にする
1. ブラウザで `https://github.com/kei12061308/fujiattak` を開く
2. 画面下部（またはブラウザのメニュー）から「デスクトップ用サイトを表示」に切り替える（スマホ表示だと Settings が出ないため）
3. 上部タブの **Settings** を押す
4. 一番下の **Danger Zone** → **Change visibility** → **Change to private** を押し、確認文を入力して確定
- ✅ 成功：リポジトリ名の横に **Private** と表示される

## 手順B：Supabase（データベース）
1. `https://supabase.com` を開き **Start your project** → **Continue with GitHub** でログイン
2. Organization 作成を求められたら、名前は何でも可・Plan は **Free** で作成
3. **New project** を押し、次のように入力
   - Project name：`kakeibo`
   - Database Password：**Generate a password** を押し、表示されたパスワードをメモ（今後ほぼ使いませんが念のため）
   - Region：**Northeast Asia (Tokyo)**
   - → **Create new project**（準備に1〜2分）
- ✅ 成功：プロジェクトのホーム画面（Project status が緑）が表示される
4. 画面上部の **Connect** ボタン（または左メニュー **Project Settings → Data API / API Keys**）を開き、次の3つを控える
   - **Project URL**（`https://xxxx.supabase.co`）
   - **Publishable key**（`sb_publishable_...`。旧画面では `anon` `public` と表示）
   - **Secret key**（`sb_secret_...`。旧画面では `service_role`。「Reveal」で表示）
5. 左メニュー **Authentication → Sign In / Providers**（旧：Settings）を開き、**Allow new users to sign up** を **オフ** にして **Save**
- ✅ 成功：スイッチがオフのまま保存される（知らない人が勝手に登録できなくなる）

## 手順C：Anthropic Console（Claude API）
1. `https://platform.claude.com` を開き、Googleアカウントまたはメールで登録
2. 左メニュー（☰）**Billing** → **Buy credits** でクレジットを購入（まずは最小額で十分）
3. 同じ Billing 画面の **Spend limits**（使用上限）で月の上限を設定（例：$10）
4. 左メニュー **API Keys** → **Create Key** → 名前 `kakeibo` で作成
5. 表示された `sk-ant-...` をコピーしてメモ（**この画面を閉じると二度と表示されません**）
- ✅ 成功：API Keys 一覧に `kakeibo` が表示される

## 手順D：Vercel（公開）
1. `https://vercel.com/signup` を開き、プランは **Hobby**、**Continue with GitHub** で登録
2. **Add New… → Project** を押す
3. 「Import Git Repository」に FUJIATTAK が出ない場合は **Adjust GitHub App Permissions** → **Only select repositories** で `fujiattak` を選んで **Save**
4. `fujiattak` の **Import** を押す
5. Framework Preset が **Next.js** になっていることを確認
6. **Environment Variables** を開き、次の5つを1つずつ追加（Key に名前、Value に値）
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | 手順B-4 の Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 手順B-4 の Publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | 手順B-4 の Secret key |
   | `ANTHROPIC_API_KEY` | 手順C-5 の `sk-ant-...` |
   | `ANTHROPIC_MODEL` | `claude-opus-5-5` |
7. **Deploy** を押す
   - この時点の main ブランチにはまだアプリが入っていないので、表示が「富士」のページやエラーでも問題ありません
8. 終わったら Claude Code に「**Vercel連携した**」と送る → Claude がフェーズ1のPRを main にマージ → 自動で再デプロイ
9. Vercel のプロジェクト画面上部の **Domains**（`xxxx.vercel.app`）を押して開く
- ✅ 成功：「ふたりの家計簿」と表示され、「設定の状態」の5項目がすべて緑の **設定済み** になっている

### うまくいかないとき
- 「未設定」が残る：Vercel → プロジェクト → **Settings → Environment Variables** で名前のつづりを確認し、修正後に **Deployments** → 最新の行の「…」→ **Redeploy**
- 環境変数は Production / Preview / Development の3つすべてにチェックが入っていることを確認
