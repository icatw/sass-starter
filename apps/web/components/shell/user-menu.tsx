'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, KeyRound, LogOut, Settings, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currentUser } from '@/lib/mock-data/overview'
import { getInitials } from '@/lib/format'
import { useI18n } from '@/components/providers/i18n-provider'

export function UserMenu() {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" aria-label={t('userMenu.open')} />}
      >
        <Avatar className="size-8">
          <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
            <span className="text-xs font-normal">{currentUser.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <UserRound />
            {t('userMenu.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <KeyRound />
            {t('userMenu.apiKeys')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings />
            {t('userMenu.workspaceSettings')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info(t('userMenu.docsToast'))}>
            <BookOpen />
            {t('userMenu.docs')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={() => toast.info(t('userMenu.signOutToast'))}>
            <LogOut />
            {t('userMenu.signOut')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
