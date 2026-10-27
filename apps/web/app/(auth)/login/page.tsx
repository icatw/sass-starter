import Link from "next/link";
export const metadata = { title: "登录" };
export default function LoginPage() { return <section><h1 className="text-3xl font-semibold">登录</h1><p className="mt-3 text-zinc-600">认证方案接入后，在此实现登录表单。</p><Link className="mt-6 inline-block underline" href="/register">创建账户</Link></section>; }
