'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, ChevronRight } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { navGroups, type NavItem } from '@/lib/navigation'
import { useI18n } from '@/components/providers/i18n-provider'

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function AvailabilityBadge({ availability }: { availability: NavItem['availability'] }) {
  const { t } = useI18n()
  if (availability === 'available') return null
  return (
    <Badge variant={availability === 'demo' ? 'secondary' : 'outline'} className="ml-auto shrink-0 text-[10px]">
      {availability === 'demo' ? t('nav.availability.demo') : t('nav.availability.planned')}
    </Badge>
  )
}

function NavItemWithChildren({ item, pathname }: { item: NavItem; pathname: string }) {
  const { state, isMobile } = useSidebar()
  const children = item.children ?? []
  const { t } = useI18n()
  const groupActive = isActivePath(pathname, item.href)

  if (state === 'collapsed' && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton isActive={groupActive} />}>
            <item.icon />
            <span>{t(`nav.items.${item.key}.title`)}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t(`nav.items.${item.key}.title`)}</DropdownMenuLabel>
              {children.map((child) => (
                <DropdownMenuItem key={child.href} render={<Link href={child.href} />} className="justify-between gap-2">
                  <span>{t(`nav.items.${child.key}.title`)}</span>
                  <AvailabilityBadge availability={child.availability} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible defaultOpen={groupActive} render={<SidebarMenuItem />}>
      <CollapsibleTrigger render={<SidebarMenuButton />}>
        <item.icon />
        <span>{t(`nav.items.${item.key}.title`)}</span>
        <AvailabilityBadge availability={item.availability} />
        <ChevronRight className="transition-transform duration-200 group-data-[panel-open]/menu-button:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {children.map((child) => (
            <SidebarMenuSubItem key={child.href}>
              <SidebarMenuSubButton isActive={pathname === child.href} render={<Link href={child.href} />}>
                <span>{t(`nav.items.${child.key}.title`)}</span>
                <AvailabilityBadge availability={child.availability} />
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={t('app.name')} render={<Link href="/" />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Boxes />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold">{t('app.name')}</span>
                <span className="truncate text-xs text-muted-foreground">{t('app.tagline')}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel>{t(`nav.groups.${group.key}`)}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) =>
                item.children ? (
                  <NavItemWithChildren key={item.href} item={item} pathname={pathname} />
                ) : (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActivePath(pathname, item.href)}
                      tooltip={t(`nav.items.${item.key}.title`)}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{t(`nav.items.${item.key}.title`)}</span>
                      <AvailabilityBadge availability={item.availability} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
