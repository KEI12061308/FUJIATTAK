import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "家計簿",
  description: "レシート読み取り対応のプライベート家計簿",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">{children}</main>
      </body>
    </html>
  );
}
