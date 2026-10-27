'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, ChevronRight } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { navGroups, type NavItem } from '@/lib/navigation'
import { SidebarUsageMeter } from '@/components/shell/sidebar-usage-meter'

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavItemWithChildren({ item, pathname }: { item: NavItem; pathname: string }) {
  const { state, isMobile } = useSidebar()
  const children = item.children ?? []
  const groupActive = isActivePath(pathname, item.href)

  if (state === 'collapsed' && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton isActive={groupActive} />}>
            <item.icon />
            <span>{item.title}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
              {children.map((child) => (
                <DropdownMenuItem key={child.href} render={<Link href={child.href} />}>
                  {child.title}
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
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[panel-open]/menu-button:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {children.map((child) => (
            <SidebarMenuSubItem key={child.href}>
              <SidebarMenuSubButton isActive={pathname === child.href} render={<Link href={child.href} />}>
                <span>{child.title}</span>
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="SaaS Foundry" render={<Link href="/" />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Boxes />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold">SaaS Foundry</span>
                <span className="truncate text-xs text-muted-foreground">Starter Kit · Development</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) =>
                item.children ? (
                  <NavItemWithChildren key={item.href} item={item} pathname={pathname} />
                ) : (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActivePath(pathname, item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUsageMeter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
