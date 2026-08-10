import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react'

import { getAllUsers } from '@/lib/services/userService'
import { RoleBadge } from '@/components/layout/role-badge'

export default async function AdminUsersPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect(dashboardPathForRole(session.role))

  const users = await getAllUsers()

  return (
    <DashboardShell user={session} title="User Account Management">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Platform User Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and oversee all patient, doctor, health worker, and administrator accounts.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Registered Platform Accounts ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono text-muted-foreground">{user.id}</td>
                      <td className="p-3 font-bold text-foreground">{user.name}</td>
                      <td className="p-3 font-mono text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="p-3">
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {user.status ?? 'ACTIVE'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
