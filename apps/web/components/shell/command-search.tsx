'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { navGroups } from '@/lib/navigation'
import { useI18n } from '@/components/providers/i18n-provider'

export function CommandSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { t } = useI18n()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden w-64 justify-start text-muted-foreground md:flex"
        aria-label={t('header.searchPages')}
      >
        <Search data-icon="inline-start" />
        <span className="flex-1 text-left">{t('header.search')}</span>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label={t('header.searchPages')}
      >
        <Search />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t('header.searchTitle')}
        description={t('header.searchDescription')}
      >
        <Command>
          <CommandInput placeholder={t('header.searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('header.searchEmpty')}</CommandEmpty>
            {navGroups.map((group) => (
              <CommandGroup key={group.key} heading={t(`nav.groups.${group.key}`)}>
                {group.items.flatMap((item) => {
                  const itemTitle = t(`nav.items.${item.key}.title`)
                  return item.children
                    ? item.children.map((child) => {
                        const childTitle = t(`nav.items.${child.key}.title`)
                        return (
                          <CommandItem
                            key={child.href}
                            value={`${itemTitle} ${childTitle} ${child.href}`}
                            onSelect={() => navigate(child.href)}
                          >
                            <item.icon />
                            <span>
                              {itemTitle} / {childTitle}
                            </span>
                          </CommandItem>
                        )
                      })
                    : [
                        <CommandItem
                          key={item.href}
                          value={`${itemTitle} ${item.href}`}
                          onSelect={() => navigate(item.href)}
                        >
                          <item.icon />
                          <span>{itemTitle}</span>
                        </CommandItem>,
                      ]
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
