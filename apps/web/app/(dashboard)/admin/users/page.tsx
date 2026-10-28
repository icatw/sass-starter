import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { getAdminUsers } from '@/lib/auth/api'
import { requireAdmin } from '@/lib/auth/session'
import { getI18n } from '@/lib/i18n/server'

export default async function AdminUsersPage() {
  await requireAdmin()
  const { t, locale } = await getI18n()
  let users: Awaited<ReturnType<typeof getAdminUsers>> = []
  let loadFailed = false

  try {
    users = await getAdminUsers()
  } catch {
    loadFailed = true
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <PageHeader title={t('adminUsers.title')} description={t('adminUsers.description')} />
      <Card>
        <CardContent className="p-0">
          {loadFailed ? (
            <div className="flex flex-col items-start gap-3 p-6" role="alert">
              <p className="text-sm text-destructive">{t('adminUsers.loadFailed')}</p>
              <Button variant="outline" size="sm" render={<Link href="/admin/users" />} nativeButton={false}>
                {t('common.retry')}
              </Button>
            </div>
          ) : users.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t('adminUsers.empty')}</p>
          ) : (
            <>
              <div className="border-b px-6 py-3 text-sm text-muted-foreground">{t('adminUsers.latest')}</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-b bg-muted/30 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t('adminUsers.name')}</th>
                      <th className="px-4 py-3 font-medium">{t('adminUsers.email')}</th>
                      <th className="px-4 py-3 font-medium">{t('adminUsers.role')}</th>
                      <th className="px-4 py-3 font-medium">{t('adminUsers.verification')}</th>
                      <th className="px-4 py-3 font-medium">{t('adminUsers.status')}</th>
                      <th className="px-4 py-3 font-medium">{t('adminUsers.createdAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr className="border-b last:border-0" key={user.id}>
                        <td className="max-w-48 truncate px-4 py-3 font-medium">{user.name}</td>
                        <td className="max-w-64 truncate px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? t('adminUsers.roleAdmin') : t('adminUsers.roleUser')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{user.emailVerified ? t('adminUsers.verified') : t('adminUsers.unverified')}</td>
                        <td className="px-4 py-3">
                          <Badge variant={user.disabled ? 'destructive' : 'outline'}>
                            {user.disabled ? t('adminUsers.disabled') : t('adminUsers.active')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString(locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
