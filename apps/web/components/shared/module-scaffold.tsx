import Link from 'next/link'
import { ArrowLeft, Check, Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { getI18n } from '@/lib/i18n/server'
import type { NavKey } from '@/lib/navigation'

interface ModuleScaffoldProps {
  itemKey: NavKey
}

export async function ModuleScaffold({ itemKey }: ModuleScaffoldProps) {
  const { t, messages } = await getI18n()
  const { title, planned } = messages.nav.items[itemKey]

  return (
    <Empty className="border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Construction />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {t('scaffold.description')}
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
        <Button variant="outline" size="sm" render={<Link href="/dashboard" />} nativeButton={false}>
          <ArrowLeft data-icon="inline-start" />
          {t('common.backToOverview')}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
