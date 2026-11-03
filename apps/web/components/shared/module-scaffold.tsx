import Link from 'next/link'
import { ArrowLeft, CircleDashed, Construction } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { getI18n } from '@/lib/i18n/server'
import { findNavLeaf, type NavKey } from '@/lib/navigation'

interface ModuleScaffoldProps {
  itemKey: NavKey
}

export async function ModuleScaffold({ itemKey }: ModuleScaffoldProps) {
  const { t, messages } = await getI18n()
  const { title, planned } = messages.nav.items[itemKey]
  const availability = findNavLeaf(itemKey)?.availability ?? 'planned'

  return (
    <Empty className="border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Construction />
        </EmptyMedia>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <EmptyTitle>{title}</EmptyTitle>
          <Badge variant={availability === 'demo' ? 'secondary' : 'outline'}>
            {availability === 'demo' ? t('nav.availability.demo') : t('nav.availability.planned')}
          </Badge>
        </div>
        <EmptyDescription>{t('scaffold.description')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {planned.length > 0 && (
          <div className="flex w-full max-w-md flex-col gap-2 text-left">
            <p className="text-sm font-medium text-foreground">{t('scaffold.plannedHeading')}</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {planned.map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <CircleDashed aria-hidden className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="outline" size="sm" render={<Link href="/dashboard" />} nativeButton={false}>
          <ArrowLeft data-icon="inline-start" />
          {t('common.backToOverview')}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
