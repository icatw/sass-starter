'use client'

import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { useI18n } from '@/components/providers/i18n-provider'
import { isLocale, localeNames, locales } from '@/lib/i18n/config'

export function LanguageSwitcher() {
  const { t, locale, setLocale, isChangingLocale } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={t('language.change')} disabled={isChangingLocale} />}
      >
        {isChangingLocale ? <Spinner /> : <Languages />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => {
              if (isLocale(value)) setLocale(value)
            }}
          >
            {locales.map((code) => (
              <DropdownMenuRadioItem key={code} value={code} lang={code}>
                {localeNames[code]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
