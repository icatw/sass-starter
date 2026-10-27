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
import { getInitials } from '@/lib/format'
import { useI18n } from '@/components/providers/i18n-provider'
import { authClient } from '@/lib/auth/client'

export function UserMenu({ user }: { user: { name: string; email: string; role: string } }) {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" aria-label={t('userMenu.open')} />}
      >
        <Avatar className="size-8">
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="text-xs font-normal">{user.email}</span>
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
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              const result = await authClient.signOut()
              if (result.error) {
                toast.error(t('errors.unknown'))
                return
              }
              router.replace('/login')
              router.refresh()
            }}
          >
            <LogOut />
            {t('userMenu.signOut')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
