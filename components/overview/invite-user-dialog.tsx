'use client'

import { useState } from 'react'
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
import { inviteUser } from '@/lib/api/overview'
import type { InviteUserInput, UserRegistration, UserRole } from '@/lib/types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'Member', label: 'Member' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Owner', label: 'Owner' },
]

const EMPTY_FORM: InviteUserInput = { name: '', email: '', organization: '', role: 'Member' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FormErrors = Partial<Record<keyof InviteUserInput, string>>

function validate(values: InviteUserInput): FormErrors {
  const errors: FormErrors = {}
  if (values.name.trim().length < 2) errors.name = 'Enter at least 2 characters.'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (!values.organization.trim()) errors.organization = 'Organization is required.'
  return errors
}

export function InviteUserDialog({ onInvited }: { onInvited: (user: UserRegistration) => void }) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<InviteUserInput>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function update<K extends keyof InviteUserInput>(key: K, value: InviteUserInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
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
      toast.success('Invitation sent', { description: `${user.name} will receive an email at ${user.email}` })
      setPending(false)
      handleOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus data-icon="inline-start" />
        Invite
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>They will get an email with a link to join the workspace.</DialogDescription>
          </DialogHeader>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field data-invalid={!!errors.name || undefined}>
              <FieldLabel htmlFor="invite-name">Full name</FieldLabel>
              <Input
                id="invite-name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={values.name}
                aria-invalid={!!errors.name || undefined}
                onChange={(event) => update('name', event.target.value)}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.email || undefined}>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                placeholder="ada@company.com"
                value={values.email}
                aria-invalid={!!errors.email || undefined}
                onChange={(event) => update('email', event.target.value)}
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
              <Field data-invalid={!!errors.organization || undefined}>
                <FieldLabel htmlFor="invite-org">Organization</FieldLabel>
                <Input
                  id="invite-org"
                  autoComplete="organization"
                  placeholder="Acme Inc."
                  value={values.organization}
                  aria-invalid={!!errors.organization || undefined}
                  onChange={(event) => update('organization', event.target.value)}
                />
                {errors.organization && <FieldError>{errors.organization}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                <Select items={ROLES} value={values.role} onValueChange={(value) => value && update('role', value as UserRole)}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLES.map((role) => (
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
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
