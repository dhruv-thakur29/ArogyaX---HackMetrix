import { mockStore } from '@/lib/db/mock/store'
import type { SessionUser, UserRole } from '@/lib/types'

export interface SocialAuthResult {
  success: boolean
  user?: SessionUser
  isDemoSimulation: boolean
  error?: string
}

export async function authenticateWithApple(
  requestedRole: UserRole = 'patient'
): Promise<SocialAuthResult> {
  const isConfigured = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_KEY_ID)

  if (!isConfigured) {
    // Development / Hackathon Demo Simulation Flow
    const demoEmail = `apple.${requestedRole}@arogyax.demo`
    let user = mockStore.users.find((u) => u.email.toLowerCase() === demoEmail)

    if (!user) {
      const id = `usr_apple_${Date.now().toString(36)}`
      user = {
        id,
        name: `Apple Sign-In User (${requestedRole.replace('_', ' ').toUpperCase()})`,
        email: demoEmail,
        role: requestedRole,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }
      mockStore.users.unshift(user)
      mockStore.credentials[id] = 'social_demo_apple'

      if (requestedRole === 'patient') {
        mockStore.patients.unshift({
          id: `pat_${Date.now().toString(36)}`,
          userId: id,
          name: user.name,
          age: 28,
          gender: 'Female',
          village: 'Apple Auth Sector',
          bloodGroup: 'A+',
          phone: '+91 99000 44556',
          registeredBy: 'Apple Sign-In',
          createdAt: new Date().toISOString(),
        })
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      isDemoSimulation: true,
    }
  }

  return {
    success: false,
    isDemoSimulation: false,
    error: 'Apple Sign-In redirection is not initialized.',
  }
}
