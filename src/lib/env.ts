import "server-only";

// 必須の環境変数。未設定のものは画面上部に警告として表示する。
const REQUIRED_ENV = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase の URL" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase の公開キー" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase の秘密キー" },
  { name: "ANTHROPIC_API_KEY", label: "Claude API キー" },
  { name: "ANTHROPIC_MODEL", label: "Claude のモデル名" },
] as const;

export type EnvCheck = { name: string; label: string; ok: boolean };

export function checkEnv(): EnvCheck[] {
  return REQUIRED_ENV.map(({ name, label }) => ({
    name,
    label,
    ok: Boolean(process.env[name]?.trim()),
  }));
}
