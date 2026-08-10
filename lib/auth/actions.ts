'use server'

import { redirect } from 'next/navigation'
import { authenticate, registerUser, authenticateSocial } from '@/lib/services/authService'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { setSessionCookie, clearSessionCookie } from '@/lib/auth/session'
import type { UserRole } from '@/lib/types'

export interface AuthFormState {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const result = await authenticate(email, password)

  if (!result.success || !result.user) {
    return { error: result.error ?? 'Unable to sign in.' }
  }

  await setSessionCookie(result.user)
  redirect(dashboardPathForRole(result.user.role))
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get('name') ?? '')
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const role = (String(formData.get('role') ?? 'patient')) as UserRole

  const result = await registerUser({
    name,
    email,
    password,
    confirmPassword,
    role,
  })

  if (!result.success || !result.user) {
    return { error: result.error ?? 'Registration failed.' }
  }

  await setSessionCookie(result.user)
  redirect(dashboardPathForRole(result.user.role))
}

export async function socialLoginAction(
  provider: 'google' | 'apple',
  requestedRole: UserRole = 'patient'
): Promise<AuthFormState> {
  const result = await authenticateSocial(provider, requestedRole)

  if (!result.success || !result.user) {
    return { error: result.error ?? 'Social login failed.' }
  }

  await setSessionCookie(result.user)
  redirect(dashboardPathForRole(result.user.role))
}

export async function logoutAction() {
  await clearSessionCookie()
  redirect('/login')
}