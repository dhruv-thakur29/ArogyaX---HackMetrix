'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, type AuthFormState } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: AuthFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full font-semibold" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState)
  const [showForgotMsg, setShowForgotMsg] = useState(false)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" name="email" type="email" placeholder="patient@arogyax.demo" required />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => setShowForgotMsg(true)}
            className="text-xs text-primary hover:underline font-medium"
          >
            Forgot password?
          </button>
        </div>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>

      {showForgotMsg && (
        <div className="rounded-md bg-amber-500/10 p-2.5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
          Demo Mode: Passwords for all demo accounts are set to <code className="font-bold">demo1234</code>. Newly created accounts use the password entered during registration.
        </div>
      )}

      {state?.error ? (
        <p className="text-xs font-semibold text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}