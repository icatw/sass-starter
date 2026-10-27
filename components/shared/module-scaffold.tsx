import Link from 'next/link'
import { ArrowLeft, Check, Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { getI18n } from '@/lib/i18n/server'

interface ModuleScaffoldProps {
  href: string
  title: string
  planned: readonly string[]
}

export async function ModuleScaffold({ href, title, planned }: ModuleScaffoldProps) {
  const { t } = await getI18n()

  return (
    <Empty className="border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Construction />
        </EmptyMedia>
        <EmptyTitle>{t('scaffold.title', { page: title })}</EmptyTitle>
        <EmptyDescription>
          {t('scaffold.description')}{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">app/(dashboard){href}/page.tsx</code>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {planned.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-left text-sm">
            {planned.map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted-foreground">
                <Check aria-hidden className="size-3.5 text-foreground" />
                {item}
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" render={<Link href="/" />} nativeButton={false}>
          <ArrowLeft data-icon="inline-start" />
          {t('common.backToOverview')}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
