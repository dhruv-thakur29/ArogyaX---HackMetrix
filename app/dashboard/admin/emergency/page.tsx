import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Siren } from 'lucide-react'

import { getEmergencyReferrals } from '@/lib/services/emergencyService'

export default async function AdminEmergencyPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect(dashboardPathForRole(session.role))

  const referrals = await getEmergencyReferrals()

  return (
    <DashboardShell user={session} title="Emergency Referral Tracking">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Emergency Dispatch Audit
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide log of critical emergency dispatches, hospital transfers, and response statuses.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Emergency Referrals ({referrals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Hospital Facility</th>
                    <th className="p-3">Reported By</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono text-muted-foreground">{r.id}</td>
                      <td className="p-3 font-bold text-foreground">{r.patientName}</td>
                      <td className="p-3">
                        <Badge variant="destructive">{r.severity}</Badge>
                      </td>
                      <td className="p-3 font-medium">{r.hospitalName}</td>
                      <td className="p-3 text-muted-foreground">{r.reportedBy} ({r.reporterRole})</td>
                      <td className="p-3">
                        <Badge variant="warning">{r.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
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
