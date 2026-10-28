'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/components/providers/i18n-provider'
import { authClient } from '@/lib/auth/client'

export function ProfileForm({ initialName, email, emailVerified }: { initialName: string; email: string; emailVerified: boolean }) {
  const { t } = useI18n()
  const [name, setName] = useState(initialName)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'status' | 'error'>('status')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = name.trim()
    if (normalizedName.length < 1 || normalizedName.length > 100) {
      setMessageType('error')
      setMessage(t('account.profile.nameRequired'))
      return
    }

    setPending(true)
    setMessage('')
    const { error } = await authClient.updateUser({ name: normalizedName })
    setPending(false)
    if (error) {
      setMessageType('error')
      setMessage(t('account.profile.saveFailed'))
      return
    }

    setName(normalizedName)
    setMessageType('status')
    setMessage(t('account.profile.saved'))
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="profile-name">{t('account.profile.name')}</Label>
        <Input
          id="profile-name"
          name="name"
          autoComplete="name"
          maxLength={100}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profile-email">{t('account.profile.email')}</Label>
        <Input id="profile-email" value={email} readOnly aria-readonly="true" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t('account.profile.emailVerified')}: {emailVerified ? t('account.profile.verified') : t('account.profile.unverified')}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? t('account.profile.saving') : t('account.profile.save')}
        </Button>
      </div>
      {message ? (
        <p className={messageType === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'} role={messageType}>
          {message}
        </p>
      ) : null}
    </form>
  )
}
