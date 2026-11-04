import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { ReceiptSchema } from "@/lib/receipt-schema";
import type { ReceiptAnalysis } from "@/lib/types";

export const runtime = "nodejs";
// 画像解析は数十秒かかることがある
export const maxDuration = 120;

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];
// Claude API の画像1枚あたりの上限（5MB）に base64 の膨張分を加味
const MAX_BASE64_LENGTH = Math.floor((5 * 1024 * 1024 * 4) / 3);

const SYSTEM_PROMPT = `あなたは日本の家計簿アプリのレシート読み取り担当です。
レシート画像から購入日・店名・支払合計・品目を読み取り、各品目を次の5つの変動費カテゴリのいずれかに分類してください。

- food（食費）: スーパー・コンビニ等で買う食材、飲料、お菓子、調味料
- dining（外食費）: レストラン、カフェ、居酒屋、ファストフード、テイクアウトの飲食
- leisure（レジャー費）: 娯楽、イベント、チケット、趣味、本、ゲーム
- health_beauty（薬・コスメ費）: 医薬品、サプリ、衛生医療品、化粧品、スキンケア
- daily_goods（生活雑貨費）: 歯磨き、シャンプー、洗剤、ティッシュ、キッチン用品、100均グッズなど日用品

分類のルール:
- 品目ごとに中身で判断する。ドラッグストアでも食品は food、洗剤は daily_goods。
- 飲食店のレシートは原則すべて dining。
- 店名や品目からどれにも当てはまらない場合は、最も近いカテゴリを選ぶ。

金額のルール:
- 各品目の price は、その品目に実際に支払った「税込」金額にする。外税表記のレシートは税率（8%軽減税率・10%）を反映して税込に換算し、端数は四捨五入する。
- 品目直下の値引き・割引行は、その品目の金額から差し引く。レシート全体にかかる値引きは、品目に按分せず無視してよい（アプリ側で調整する）。
- 品目の price の合計が支払合計にできるだけ一致するようにする。
- 小計、合計、消費税、お預り、お釣り、ポイント、クレジット等の支払明細は items に含めない。

読み取れない項目は推測で埋めず null（店名は空文字）にする。`;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません。.env.local に設定してください。" },
      { status: 500 },
    );
  }

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  const { image, mediaType } = body;
  if (typeof image !== "string" || image.length === 0) {
    return NextResponse.json({ error: "画像データがありません" }, { status: 400 });
  }
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType as AllowedMediaType)) {
    return NextResponse.json({ error: "対応していない画像形式です" }, { status: 400 });
  }
  if (image.length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ error: "画像サイズが大きすぎます（5MBまで）" }, { status: 413 });
  }

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // 安全分類器による拒否時は、サーバー側で推奨モデルに自動フォールバック
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(ReceiptSchema),
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as AllowedMediaType, data: image },
            },
            { type: "text", text: "このレシートを読み取ってください。" },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "この画像は解析できませんでした。別の写真で試すか、手動で入力してください。" },
        { status: 422 },
      );
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      return NextResponse.json(
        { error: "レシートの読み取り結果を取得できませんでした。もう一度お試しください。" },
        { status: 502 },
      );
    }

    const parsed = response.parsed_output;
    const result: ReceiptAnalysis = {
      date: parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null,
      store: parsed.store.trim(),
      total: parsed.total != null ? Math.round(parsed.total) : null,
      items: parsed.items
        .filter((i) => i.name.trim() !== "")
        .map((i) => ({ name: i.name.trim(), price: Math.round(i.price), category: i.category })),
    };
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Claude API キーが無効です" }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "API の利用上限に達しました。しばらく待ってから再試行してください。" },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.BadRequestError) {
      console.error("Claude API bad request:", err.message);
      return NextResponse.json({ error: "画像を処理できませんでした" }, { status: 400 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Claude API error:", err.status, err.message);
      return NextResponse.json(
        { error: "レシート解析サービスでエラーが発生しました。再試行してください。" },
        { status: 502 },
      );
    }
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }
}
