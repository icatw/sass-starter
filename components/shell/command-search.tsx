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

export function CommandSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

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
        aria-label="Search pages"
      >
        <Search data-icon="inline-start" />
        <span className="flex-1 text-left">Search...</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="md:hidden" aria-label="Search pages">
        <Search />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to any page in the dashboard">
        <Command>
          <CommandInput placeholder="Search pages and modules..." />
          <CommandList>
            <CommandEmpty>No matching pages.</CommandEmpty>
            {navGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.flatMap((item) =>
                  item.children
                    ? item.children.map((child) => (
                        <CommandItem
                          key={child.href}
                          value={`${item.title} ${child.title}`}
                          onSelect={() => navigate(child.href)}
                        >
                          <item.icon />
                          <span>
                            {item.title} / {child.title}
                          </span>
                        </CommandItem>
                      ))
                    : [
                        <CommandItem key={item.href} value={item.title} onSelect={() => navigate(item.href)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </CommandItem>,
                      ],
                )}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
