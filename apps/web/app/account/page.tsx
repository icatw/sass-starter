import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth/session'
import { getApiProfile } from '@/lib/auth/api'

export default async function AccountPage() {
  const { user } = await requireUser()
  if (user.role === 'admin') redirect('/dashboard')
  const profile = await getApiProfile()
  if (!profile) redirect('/login')

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <PageHeader title="账户" description="查看你的已验证 SaaS Foundry 账户信息。" />
      <Card>
        <CardHeader><CardTitle>个人资料</CardTitle></CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div><div className="text-muted-foreground">姓名</div><div>{profile.name}</div></div>
          <div><div className="text-muted-foreground">邮箱</div><div>{profile.email}</div></div>
          <div><div className="text-muted-foreground">邮箱状态</div><div>{user.emailVerified ? '已验证' : '未验证'}</div></div>
        </CardContent>
      </Card>
    </main>
  )
}
