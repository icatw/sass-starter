'use client'

import { AlertCircle, RotateCw } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Could not load data</AlertTitle>
      <AlertDescription>{message ?? 'The request failed. Check your connection and try again.'}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw data-icon="inline-start" />
          Retry
        </Button>
      </AlertAction>
    </Alert>
  )
}
