import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

const USED = 2_412_580
const QUOTA = 3_000_000

export function SidebarUsageMeter() {
  const percent = Math.round((USED / QUOTA) * 100)

  return (
    <Link
      href="/usage"
      className="flex flex-col gap-2 rounded-md border bg-background p-3 text-xs transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
    >
      <span className="flex items-center justify-between">
        <span className="font-medium text-foreground">Pooled credits</span>
        <span className="tabular-nums text-muted-foreground">{percent}%</span>
      </span>
      <Progress value={percent} aria-label="Pooled credit usage" />
      <span className="tabular-nums text-muted-foreground">2.41M of 3M used · resets Nov 1</span>
    </Link>
  )
}
