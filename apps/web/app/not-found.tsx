import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { getI18n } from '@/lib/i18n/server'

export default async function NotFound() {
  const { t } = await getI18n()

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t('notFound.title')}</EmptyTitle>
          <EmptyDescription>{t('notFound.description')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/" />} nativeButton={false}>
            {t('notFound.cta')}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
