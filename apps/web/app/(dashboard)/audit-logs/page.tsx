import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { getAdminAuditLogs } from '@/lib/auth/api'
import { requireAdmin } from '@/lib/auth/session'
import { getI18n } from '@/lib/i18n/server'

function actionLabel(action: string, t: Awaited<ReturnType<typeof getI18n>>['t']) {
  switch (action) {
    case 'user.disable':
      return t('auditLogs.actions.userDisable')
    case 'user.restore':
      return t('auditLogs.actions.userRestore')
    default:
      return action
  }
}

export default async function AuditLogsPage() {
  await requireAdmin()
  const { t, locale } = await getI18n()
  let events: Awaited<ReturnType<typeof getAdminAuditLogs>> = []
  let loadFailed = false

  try {
    events = await getAdminAuditLogs()
  } catch {
    loadFailed = true
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <PageHeader title={t('auditLogs.title')} description={t('auditLogs.description')} />
      <Card>
        <CardContent className="p-0">
          {loadFailed ? (
            <div className="flex flex-col items-start gap-3 p-6" role="alert">
              <p className="text-sm text-destructive">{t('auditLogs.loadFailed')}</p>
              <Button variant="outline" size="sm" render={<Link href="/audit-logs" />} nativeButton={false}>
                {t('common.retry')}
              </Button>
            </div>
          ) : events.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t('auditLogs.empty')}</p>
          ) : (
            <>
              <div className="border-b px-6 py-3 text-sm text-muted-foreground">{t('auditLogs.latest')}</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="border-b bg-muted/30 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t('auditLogs.createdAt')}</th>
                      <th className="px-4 py-3 font-medium">{t('auditLogs.actor')}</th>
                      <th className="px-4 py-3 font-medium">{t('auditLogs.action')}</th>
                      <th className="px-4 py-3 font-medium">{t('auditLogs.resource')}</th>
                      <th className="px-4 py-3 font-medium">{t('auditLogs.requestId')}</th>
                      <th className="px-4 py-3 font-medium">{t('auditLogs.metadata')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr className="border-b last:border-0" key={event.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString(locale)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-56 truncate font-medium">{event.actorName || event.actorUserId}</div>
                          <div className="max-w-56 truncate text-xs text-muted-foreground">{event.actorEmail || event.actorUserId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={event.action === 'user.disable' ? 'destructive' : 'secondary'}>
                            {actionLabel(event.action, t)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{event.resourceType}</div>
                          <div className="max-w-48 truncate text-xs text-muted-foreground">{event.resourceId}</div>
                        </td>
                        <td className="max-w-40 truncate px-4 py-3 text-xs text-muted-foreground">{event.requestId || '—'}</td>
                        <td className="px-4 py-3">
                          <code className="block max-w-72 truncate rounded bg-muted px-2 py-1 text-xs">
                            {JSON.stringify(event.metadata ?? {})}
                          </code>
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
