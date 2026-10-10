import { connection } from "next/server";
import { checkEnv } from "@/lib/env";

// 値そのものは表示せず、設定済みかどうかだけを出す。
export async function EnvStatus() {
  await connection();
  const checks = checkEnv();
  const missing = checks.filter((c) => !c.ok);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-bold">設定の状態</h2>
      {missing.length > 0 && (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          未設定の環境変数が {missing.length} 件あります。Vercel の Settings →
          Environment Variables で設定してください。
        </p>
      )}
      <ul className="space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-2">
            <span>
              {c.label}
              <span className="block text-xs text-zinc-500">{c.name}</span>
            </span>
            <span
              className={
                c.ok
                  ? "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700"
                  : "shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-red-700"
              }
            >
              {c.ok ? "設定済み" : "未設定"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
