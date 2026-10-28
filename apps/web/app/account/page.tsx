import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth/session'
import { getI18n } from '@/lib/i18n/server'
import { ProfileForm } from '@/components/account/profile-form'

export default async function AccountPage() {
  const { user } = await requireUser()
  if (user.role === 'admin') redirect('/dashboard')
  const { t } = await getI18n()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title={t('account.title')}
        description={t('account.description')}
        actions={<Button render={<Link href="/account/tasks" />} nativeButton={false}>{t('tasks.title')}</Button>}
      />
      <Card>
        <CardHeader><CardTitle>{t('account.profile.title')}</CardTitle></CardHeader>
        <CardContent>
          <ProfileForm initialName={user.name ?? ''} email={user.email} emailVerified={user.emailVerified} />
        </CardContent>
      </Card>
    </main>
  )
}
