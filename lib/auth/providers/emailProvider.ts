import { mockStore } from '@/lib/db/mock/store'
import type { SessionUser } from '@/lib/types'

export interface AuthProviderResult {
  success: boolean
  user?: SessionUser
  error?: string
}

export async function authenticateWithEmail(
  email: string,
  password: string
): Promise<AuthProviderResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = mockStore.users.find((u) => u.email.toLowerCase() === normalizedEmail)

  if (!user) {
    return { success: false, error: 'User with this email does not exist.' }
  }

  const storedPassword = mockStore.credentials[user.id] ?? 'demo1234'
  if (storedPassword !== password) {
    return { success: false, error: 'Invalid password. Please check your credentials.' }
  }

  if (user.status === 'INACTIVE') {
    return { success: false, error: 'Your account has been deactivated. Please contact support.' }
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }
}
