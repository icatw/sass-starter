import { ModuleScaffold } from '@/components/shared/module-scaffold'
import type { NavKey } from '@/lib/navigation'

export function ModulePage({ itemKey }: { itemKey: NavKey }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ModuleScaffold itemKey={itemKey} />
    </div>
  )
}
