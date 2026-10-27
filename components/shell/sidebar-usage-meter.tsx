'use client'

import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/components/providers/i18n-provider'

const USED = 2_412_580
const QUOTA = 3_000_000
const RESETS_AT = '2026-11-01T00:00:00Z'

export function SidebarUsageMeter() {
  const { t, format } = useI18n()
  const percent = Math.round((USED / QUOTA) * 100)

  return (
    <Link
      href="/usage"
      className="flex flex-col gap-2 rounded-md border bg-background p-3 text-xs transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
    >
      <span className="flex items-center justify-between">
        <span className="font-medium text-foreground">{t('usageMeter.title')}</span>
        <span className="tabular-nums text-muted-foreground">{percent}%</span>
      </span>
      <Progress value={percent} aria-label={t('usageMeter.aria')} />
      <span className="tabular-nums text-muted-foreground">
        {t('usageMeter.summary', {
          used: format.compact(USED),
          quota: format.compact(QUOTA),
          date: format.monthDay(RESETS_AT),
        })}
      </span>
    </Link>
  )
}
