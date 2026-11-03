import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { getAdminSettings } from '@/lib/auth/api'
import { requireAdmin } from '@/lib/auth/session'
import { getWebEnv } from '@/lib/env'
import { getI18n } from '@/lib/i18n/server'

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono text-sm">{value}</dd>
    </div>
  )
}

export default async function SettingsPage() {
  await requireAdmin()
  const { t } = await getI18n()
  const webEnv = getWebEnv()
  let apiSettings: Awaited<ReturnType<typeof getAdminSettings>> | null = null
  let loadFailed = false

  try {
    apiSettings = await getAdminSettings()
  } catch {
    loadFailed = true
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.web.title')}</CardTitle>
          <CardDescription>{t('settings.web.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl>
            <SettingRow label={t('settings.web.appName')} value={t('app.name')} />
            <SettingRow label={t('settings.web.appURL')} value={webEnv.appURL} />
            <SettingRow label={t('settings.web.authURL')} value={webEnv.authURL} />
            <SettingRow label={t('settings.web.authEmailMode')} value={webEnv.authEmailMode} />
            <SettingRow label={t('settings.web.appEnv')} value={webEnv.appEnv} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.api.title')}</CardTitle>
          <CardDescription>{t('settings.api.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadFailed || !apiSettings ? (
            <div className="flex flex-col items-start gap-3" role="alert">
              <p className="text-sm text-destructive">{t('settings.loadFailed')}</p>
              <Button variant="outline" size="sm" render={<Link href="/settings" />} nativeButton={false}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <dl>
              <SettingRow label={t('settings.api.appEnv')} value={apiSettings.appEnv} />
              <SettingRow label={t('settings.api.apiPort')} value={apiSettings.apiPort} />
              <SettingRow label={t('settings.api.issuerURL')} value={apiSettings.issuerURL} />
              <SettingRow label={t('settings.api.audience')} value={apiSettings.audience} />
              <div className="grid gap-1 border-b py-3 last:border-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
                <dt className="text-sm text-muted-foreground">{t('settings.api.databaseConfigured')}</dt>
                <dd>
                  <Badge variant={apiSettings.databaseConfigured ? 'secondary' : 'destructive'}>
                    {apiSettings.databaseConfigured
                      ? t('settings.api.databaseYes')
                      : t('settings.api.databaseNo')}
                  </Badge>
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{t('settings.readOnlyNotice')}</p>
    </div>
  )
}
