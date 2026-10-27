import Link from "next/link";

export default function HomePage() {
  return <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-6 py-24"><p className="text-sm font-medium text-zinc-500">AI-native SaaS Starter</p><h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">从这里开始构建你的 SaaS 产品</h1><p className="max-w-2xl text-lg leading-8 text-zinc-600">Next.js Web、Go Gin API、OpenAPI 契约和可复现的开发 Harness，按功能切片持续交付。</p><div className="flex gap-3"><Link className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white" href="/register">开始使用</Link><Link className="rounded-md border px-5 py-3 text-sm font-medium" href="/pricing">查看定价</Link></div></main>;
}
