import { mockStore } from '@/lib/db/mock/store'
import type { SessionUser, UserRole } from '@/lib/types'

export interface SocialAuthResult {
  success: boolean
  user?: SessionUser
  isDemoSimulation: boolean
  error?: string
}

export async function authenticateWithGoogle(
  requestedRole: UserRole = 'patient'
): Promise<SocialAuthResult> {
  const isConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

  if (!isConfigured) {
    // Development / Hackathon Demo Simulation Flow
    const demoEmail = `google.${requestedRole}@arogyax.demo`
    let user = mockStore.users.find((u) => u.email.toLowerCase() === demoEmail)

    if (!user) {
      const id = `usr_google_${Date.now().toString(36)}`
      user = {
        id,
        name: `Google User (${requestedRole.replace('_', ' ').toUpperCase()})`,
        email: demoEmail,
        role: requestedRole,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }
      mockStore.users.unshift(user)
      mockStore.credentials[id] = 'social_demo_oauth'

      if (requestedRole === 'patient') {
        mockStore.patients.unshift({
          id: `pat_${Date.now().toString(36)}`,
          userId: id,
          name: user.name,
          age: 30,
          gender: 'Other',
          village: 'Google Auth Sector',
          bloodGroup: 'B+',
          phone: '+91 99000 11223',
          registeredBy: 'Google Single Sign-On',
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

  // Real Google OAuth production flow place-holder logic
  return {
    success: false,
    isDemoSimulation: false,
    error: 'Google OAuth redirection is not initialized.',
  }
}
