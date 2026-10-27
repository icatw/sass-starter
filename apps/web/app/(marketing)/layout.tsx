import Link from "next/link";
import type { ReactNode } from "react";

export default function MarketingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <><header className="flex items-center justify-between border-b px-6 py-4"><Link href="/" className="font-semibold">SaaS Starter</Link><nav className="flex gap-5 text-sm"><Link href="/pricing">定价</Link><Link href="/blog">博客</Link><Link href="/login">登录</Link></nav></header>{children}</>;
}
