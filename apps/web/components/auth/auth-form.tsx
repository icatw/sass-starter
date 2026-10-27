'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'login' | 'register' | 'reset' | 'set-password'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setError('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    try {
      if (mode === 'register') {
        const result = await authClient.signUp.email({
          name: String(form.get('name') ?? ''), email,
          password: String(form.get('password') ?? ''), callbackURL: '/account',
        })
        if (result.error) throw new Error(result.error.message ?? '注册失败')
        setMessage('验证邮件已发送，请检查邮箱后完成验证。')
      } else if (mode === 'login') {
        const result = await authClient.signIn.email({
          email, password: String(form.get('password') ?? ''), callbackURL: '/account',
        })
        if (result.error) throw new Error(result.error.message ?? '登录失败')
        router.replace('/account')
        router.refresh()
      } else if (mode === 'reset') {
        const result = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password/confirm' })
        if (result.error) throw new Error(result.error.message ?? '无法发送重置邮件')
        setMessage('如果该邮箱已注册，密码重置邮件将很快送达。')
      } else {
        const result = await authClient.resetPassword({
          newPassword: String(form.get('password') ?? ''),
          token: new URLSearchParams(window.location.search).get('token') ?? '',
        })
        if (result.error) throw new Error(result.error.message ?? '重置链接无效或已过期')
        setMessage('密码已更新，请使用新密码登录。')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '请求失败，请稍后重试。')
    } finally {
      setPending(false)
    }
  }

  const title = mode === 'register' ? '创建账户' : mode === 'reset' ? '重置密码' : '登录'
  return <section className="w-full">
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{mode === 'register' ? '注册后请通过邮件验证你的邮箱。' : mode === 'reset' ? '输入注册邮箱以接收密码重置链接。' : '使用已验证的邮箱和密码继续。'}</p>
    <form onSubmit={submit} className="mt-8 space-y-5">
      {mode === 'register' && <div className="space-y-2"><Label htmlFor="name">姓名</Label><Input id="name" name="name" autoComplete="name" required maxLength={100} /></div>}
      {(mode === 'login' || mode === 'register' || mode === 'reset') && <div className="space-y-2"><Label htmlFor="email">邮箱</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>}
      {(mode === 'login' || mode === 'register' || mode === 'set-password') && <div className="space-y-2"><Label htmlFor="password">密码</Label><Input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} /></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? '请稍候…' : title}</Button>
    </form>
    <nav className="mt-6 flex flex-wrap justify-between gap-3 text-sm underline underline-offset-4">
      {mode === 'login' ? <><Link href="/register">创建账户</Link><Link href="/reset-password">忘记密码？</Link></> : mode === 'set-password' ? <Link href="/login">返回登录</Link> : <Link href="/login">返回登录</Link>}
    </nav>
  </section>
}
