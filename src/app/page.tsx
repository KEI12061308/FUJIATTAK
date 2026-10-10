import { Suspense } from "react";
import { EnvStatus } from "./env-status";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">ふたりの家計簿</h1>
        <p className="mt-1 text-sm text-zinc-600">
          準備中です。この画面が表示されていれば公開は成功しています。
        </p>
      </header>
      <Suspense
        fallback={
          <p className="rounded-2xl bg-white p-4 text-sm text-zinc-500 shadow-sm">
            設定を確認しています…
          </p>
        }
      >
        <EnvStatus />
      </Suspense>
    </main>
  );
}
