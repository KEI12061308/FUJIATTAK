"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/receipts", label: "レシート読取" },
  { href: "/expenses", label: "履歴・入力" },
  { href: "/budgets", label: "予算設定" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 whitespace-nowrap py-3 text-base font-bold">
          家計簿
        </Link>
        <nav className="-mb-px flex gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap border-b-2 px-3 py-3 ${
                  active
                    ? "border-accent font-semibold text-text"
                    : "border-transparent text-text-2 hover:text-text"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
