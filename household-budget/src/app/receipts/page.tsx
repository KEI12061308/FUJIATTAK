"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ExpenseEditor } from "@/components/ExpenseEditor";
import { newId, todayLocal } from "@/lib/format";
import { prepareReceiptImage } from "@/lib/image";
import { upsertExpense } from "@/lib/store";
import type { Expense, ReceiptAnalysis } from "@/lib/types";

type State =
  | { step: "idle" }
  | { step: "analyzing"; previewUrl: string }
  | { step: "review"; previewUrl: string; draft: Expense; receiptTotal: number | null }
  | { step: "error"; previewUrl?: string; message: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function toDraft(result: ReceiptAnalysis): Expense {
  const now = new Date().toISOString();
  return {
    id: newId(),
    date: result.date ?? todayLocal(),
    store: result.store,
    total: result.items.reduce((s, i) => s + i.price, 0),
    items: result.items.map((i) => ({ id: newId(), ...i })),
    source: "receipt",
    createdAt: now,
    updatedAt: now,
  };
}

export default function ReceiptsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ step: "idle" });
  const [dragging, setDragging] = useState(false);

  const analyze = async (file: File) => {
    if (!ACCEPT.split(",").includes(file.type)) {
      setState({ step: "error", message: "JPEG / PNG / WebP / GIF の画像を選択してください（HEIC は未対応です）" });
      return;
    }
    let previewUrl: string | undefined;
    try {
      const image = await prepareReceiptImage(file);
      previewUrl = image.previewUrl;
      setState({ step: "analyzing", previewUrl });

      const res = await fetch("/api/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.base64, mediaType: image.mediaType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `解析に失敗しました（${res.status}）`);

      const result = data as ReceiptAnalysis;
      setState({ step: "review", previewUrl, draft: toDraft(result), receiptTotal: result.total });
    } catch (err) {
      setState({
        step: "error",
        previewUrl,
        message: err instanceof Error ? err.message : "解析に失敗しました",
      });
    }
  };

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void analyze(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const startManual = () => {
    const now = new Date().toISOString();
    const previewUrl = state.step === "error" ? state.previewUrl : undefined;
    setState({
      step: "review",
      previewUrl: previewUrl ?? "",
      receiptTotal: null,
      draft: {
        id: newId(),
        date: todayLocal(),
        store: "",
        total: 0,
        items: [{ id: newId(), name: "", price: 0, category: "food" }],
        source: "manual",
        createdAt: now,
        updatedAt: now,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">レシート読み取り</h1>
        <p className="mt-1 text-sm text-text-2">
          レシートの写真をアップロードすると、日付・店名・品目・金額を読み取り、カテゴリに自動で振り分けます。保存前に内容を確認・修正できます。
        </p>
      </div>

      {(state.step === "idle" || state.step === "error") && (
        <div
          className={`card flex flex-col items-center justify-center gap-3 border-2 border-dashed py-12 text-center ${
            dragging ? "border-accent bg-surface-2" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFiles(e.dataTransfer.files);
          }}
        >
          <p className="text-sm text-text-2">ここに画像をドラッグ＆ドロップ</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
              画像を選択 / 撮影
            </button>
            <button type="button" className="btn-secondary" onClick={startManual}>
              手動で入力する
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            capture="environment"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          {state.step === "error" && (
            <p className="max-w-md text-sm text-critical" role="alert">
              {state.message}
            </p>
          )}
        </div>
      )}

      {state.step === "analyzing" && (
        <div className="card grid gap-5 sm:grid-cols-[200px_1fr] sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.previewUrl} alt="" className="max-h-72 w-full rounded-lg object-contain opacity-70" />
          <div className="flex items-center gap-3" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span className="text-sm">レシートを解析しています…（数十秒かかることがあります）</span>
          </div>
        </div>
      )}

      {state.step === "review" && (
        <div className="card">
          <h2 className="mb-4 text-base font-semibold">
            {state.draft.source === "receipt" ? "読み取り結果の確認" : "支出の入力"}
          </h2>
          <ExpenseEditor
            initial={state.draft}
            receiptTotal={state.receiptTotal}
            previewUrl={state.previewUrl || undefined}
            saveLabel="この内容で保存"
            onSave={(expense) => {
              upsertExpense(expense);
              router.push(`/expenses?month=${expense.date.slice(0, 7)}`);
            }}
            onCancel={() => setState({ step: "idle" })}
          />
        </div>
      )}
    </div>
  );
}
