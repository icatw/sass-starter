import Link from 'next/link'
import { ArrowLeft, Check, Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { ResolvedPage } from '@/lib/navigation'

export function ModuleScaffold({ page }: { page: ResolvedPage }) {
  return (
    <Empty className="border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Construction />
        </EmptyMedia>
        <EmptyTitle>{page.title} is scaffolded</EmptyTitle>
        <EmptyDescription>
          The route, navigation, and layout are wired up. Drop the module UI into{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">app/(dashboard){page.href}/page.tsx</code>.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {page.planned.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-left text-sm">
            {page.planned.map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted-foreground">
                <Check aria-hidden className="size-3.5 text-foreground" />
                {item}
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" render={<Link href="/" />} nativeButton={false}>
          <ArrowLeft data-icon="inline-start" />
          Back to overview
        </Button>
      </EmptyContent>
    </Empty>
  )
}
