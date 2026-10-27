import Link from "next/link";
export const metadata = { title: "注册" };
export default function RegisterPage() { return <section><h1 className="text-3xl font-semibold">创建账户</h1><p className="mt-3 text-zinc-600">认证方案接入后，在此实现注册流程。</p><Link className="mt-6 inline-block underline" href="/login">已有账户？登录</Link></section>; }
