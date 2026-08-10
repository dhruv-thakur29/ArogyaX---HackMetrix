import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/auth/permissions'
import type { UserRole } from '@/lib/types'

const ROLE_VARIANT: Record<UserRole, 'default' | 'accent' | 'success' | 'warning'> = {
  patient: 'default',
  doctor: 'accent',
  health_worker: 'success',
  admin: 'warning',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{ROLE_LABELS[role]}</Badge>
}