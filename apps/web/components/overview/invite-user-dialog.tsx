'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useI18n } from '@/components/providers/i18n-provider'
import { translateError } from '@/components/shared/error-state'
import { inviteUser } from '@/lib/api/overview'
import type { InviteUserInput, UserRegistration, UserRole } from '@/lib/types'

const ROLES: UserRole[] = ['Member', 'Admin', 'Owner']

const EMPTY_FORM: InviteUserInput = { name: '', email: '', organization: '', role: 'Member' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ValidatedField = 'name' | 'email' | 'organization'
type FormErrors = Partial<Record<ValidatedField, true>>

function validate(values: InviteUserInput): FormErrors {
  const errors: FormErrors = {}
  if (values.name.trim().length < 2) errors.name = true
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = true
  if (!values.organization.trim()) errors.organization = true
  return errors
}

export function InviteUserDialog({ onInvited }: { onInvited: (user: UserRegistration) => void }) {
  const { t } = useI18n()
  const roleItems = useMemo(() => ROLES.map((value) => ({ value, label: t(`roles.${value}`) })), [t])
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<InviteUserInput>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<unknown>(null)
  const [pending, setPending] = useState(false)

  function update<K extends keyof InviteUserInput>(key: K, value: InviteUserInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (key !== 'role' && errors[key as ValidatedField]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleOpenChange(next: boolean) {
    if (pending) return
    setOpen(next)
    if (!next) {
      setValues(EMPTY_FORM)
      setErrors({})
      setSubmitError(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)
    try {
      const user = await inviteUser(values)
      onInvited(user)
      toast.success(t('invite.success'), {
        description: t('invite.successDescription', { name: user.name, email: user.email }),
      })
      setPending(false)
      handleOpenChange(false)
    } catch (error) {
      setSubmitError(error)
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus data-icon="inline-start" />
        {t('invite.trigger')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{t('invite.title')}</DialogTitle>
            <DialogDescription>{t('invite.description')}</DialogDescription>
          </DialogHeader>

          {submitError != null && (
            <Alert variant="destructive">
              <AlertDescription>{translateError(t, submitError)}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field data-invalid={!!errors.name || undefined}>
              <FieldLabel htmlFor="invite-name">{t('invite.name')}</FieldLabel>
              <Input
                id="invite-name"
                autoComplete="name"
                placeholder={t('invite.namePlaceholder')}
                value={values.name}
                aria-invalid={!!errors.name || undefined}
                onChange={(event) => update('name', event.target.value)}
              />
              {errors.name && <FieldError>{t('invite.validation.name')}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.email || undefined}>
              <FieldLabel htmlFor="invite-email">{t('invite.email')}</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                placeholder={t('invite.emailPlaceholder')}
                value={values.email}
                aria-invalid={!!errors.email || undefined}
                onChange={(event) => update('email', event.target.value)}
              />
              {errors.email && <FieldError>{t('invite.validation.email')}</FieldError>}
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
              <Field data-invalid={!!errors.organization || undefined}>
                <FieldLabel htmlFor="invite-org">{t('invite.organization')}</FieldLabel>
                <Input
                  id="invite-org"
                  autoComplete="organization"
                  placeholder={t('invite.organizationPlaceholder')}
                  value={values.organization}
                  aria-invalid={!!errors.organization || undefined}
                  onChange={(event) => update('organization', event.target.value)}
                />
                {errors.organization && <FieldError>{t('invite.validation.organization')}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-role">{t('invite.role')}</FieldLabel>
                <Select items={roleItems} value={values.role} onValueChange={(value) => value && update('role', value as UserRole)}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {roleItems.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>{t('common.cancel')}</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {t('invite.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
