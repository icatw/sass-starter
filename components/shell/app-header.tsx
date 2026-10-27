'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { CommandSearch } from '@/components/shell/command-search'
import { NotificationsMenu } from '@/components/shell/notifications-menu'
import { UserMenu } from '@/components/shell/user-menu'
import { findPage } from '@/lib/navigation'

export function AppHeader() {
  const pathname = usePathname()
  const crumbs = findPage(pathname)?.breadcrumbs ?? [{ title: 'Not found', href: pathname }]

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4 self-center" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink render={<Link href="/" />}>SaaS Foundry</BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            return (
              <Fragment key={crumb.href}>
                <BreadcrumbSeparator className={index === 0 ? 'hidden sm:inline-flex' : undefined} />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={crumb.href} />}>{crumb.title}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-1">
        <CommandSearch />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  )
}
