import { mockStore } from '@/lib/db/mock/store'
import { authenticateWithEmail } from '@/lib/auth/providers/emailProvider'
import { authenticateWithGoogle } from '@/lib/auth/providers/googleProvider'
import { authenticateWithApple } from '@/lib/auth/providers/appleProvider'
import type { SessionUser, UserRole } from '@/lib/types'

export interface AuthResult {
  success: boolean
  user?: SessionUser
  error?: string
  message?: string
}

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  return authenticateWithEmail(email, password)
}

export async function authenticateSocial(
  provider: 'google' | 'apple',
  requestedRole: UserRole = 'patient'
): Promise<AuthResult> {
  if (provider === 'google') {
    const res = await authenticateWithGoogle(requestedRole)
    return {
      success: res.success,
      user: res.user,
      error: res.error,
      message: res.isDemoSimulation ? 'Signed in via simulated Google OAuth.' : undefined,
    }
  } else {
    const res = await authenticateWithApple(requestedRole)
    return {
      success: res.success,
      user: res.user,
      error: res.error,
      message: res.isDemoSimulation ? 'Signed in via simulated Apple Sign-In.' : undefined,
    }
  }
}

export async function registerUser(params: {
  name: string
  email: string
  password: string
  confirmPassword?: string
  role: UserRole
}): Promise<AuthResult> {
  const { name, email, password, confirmPassword, role } = params

  if (!name.trim()) {
    return { success: false, error: 'Full name is required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: 'Please provide a valid email address.' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' }
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  if (role === 'admin') {
    return { success: false, error: 'Admin accounts cannot be created via public registration.' }
  }

  const existingUser = mockStore.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  )

  if (existingUser) {
    return { success: false, error: 'An account with this email address already exists.' }
  }

  const userId = `usr_${role}_${Date.now().toString(36)}`
  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
  }

  mockStore.users.unshift(newUser)
  mockStore.credentials[userId] = password

  if (role === 'patient') {
    const patientId = `pat_${Date.now().toString(36)}`
    mockStore.patients.unshift({
      id: patientId,
      userId,
      name: newUser.name,
      age: 30,
      gender: 'Female',
      village: 'Self-Registered',
      bloodGroup: 'O+',
      phone: '+91 98765 00000',
      registeredBy: 'Self Registration',
      createdAt: new Date().toISOString(),
    })
  }

  const sessionUser: SessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  }

  return { success: true, user: sessionUser }
}