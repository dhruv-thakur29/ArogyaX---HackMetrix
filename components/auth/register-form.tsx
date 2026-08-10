'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { registerAction, type AuthFormState } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: AuthFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full font-semibold" disabled={pending}>
      {pending ? 'Creating Account…' : 'Create Account'}
    </Button>
  )
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Dr. Ananya Sharma or Ramesh Kumar"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Account Role *</Label>
        <select
          id="role"
          name="role"
          defaultValue="patient"
          className="w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        >
          <option value="patient">Patient (Personal Health &amp; Consultations)</option>
          <option value="doctor">Doctor (Clinical Consultations &amp; Tele-Health)</option>
          <option value="health_worker">Health Worker (Field Vitals, Vaccinations &amp; Offline Sync)</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Min 6 characters"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            minLength={6}
            required
          />
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20 text-xs font-semibold text-destructive">
          {state.error}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  )
}
