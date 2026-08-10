import type { UserRole } from '@/lib/types'
import { ROLE_DASHBOARD_PREFIX, ROLE_LABELS } from '@/lib/auth/constants'

export { ROLE_LABELS }

export function canAccessPath(role: UserRole, pathname: string): boolean {
  return pathname.startsWith(ROLE_DASHBOARD_PREFIX[role])
}

export function dashboardPathForRole(role: UserRole): string {
  return ROLE_DASHBOARD_PREFIX[role]
}