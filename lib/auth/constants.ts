import type { UserRole } from '@/lib/types'

// Edge-safe (no next/headers import) so middleware.ts can use it directly.

export const SESSION_COOKIE_NAME = 'arogyax_session'

export const ROLE_DASHBOARD_PREFIX: Record<UserRole, string> = {
  patient: '/dashboard/patient',
  doctor: '/dashboard/doctor',
  health_worker: '/dashboard/health-worker',
  admin: '/dashboard/admin',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  health_worker: 'Health Worker',
  admin: 'Admin',
}