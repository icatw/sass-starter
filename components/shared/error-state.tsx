'use client'

import { AlertCircle, RotateCw } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'
import { ApiError } from '@/lib/api/errors'
import type { Translator } from '@/lib/i18n/translator'

export function translateError(t: Translator, error: unknown, fallback?: string) {
  if (error instanceof ApiError) return t(`errors.${error.code}`, error.params)
  return fallback ?? t('errors.unknown')
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry: () => void }) {
  const { t } = useI18n()

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{t('errorState.title')}</AlertTitle>
      <AlertDescription>{translateError(t, error, t('errorState.fallback'))}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw data-icon="inline-start" />
          {t('common.retry')}
        </Button>
      </AlertAction>
    </Alert>
  )
}
