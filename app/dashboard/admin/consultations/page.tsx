import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stethoscope } from 'lucide-react'

import { getAllConsultations } from '@/lib/services/consultationService'

export default async function AdminConsultationsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect(dashboardPathForRole(session.role))

  const consultations = await getAllConsultations()

  return (
    <DashboardShell user={session} title="Consultations Oversight">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Platform-Wide Consultations Audit
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor tele-consultation activity, queue velocity, and physician response times.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">All Consultations ({consultations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {consultations.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono text-muted-foreground">{c.id}</td>
                      <td className="p-3 font-bold text-foreground">{c.patientName}</td>
                      <td className="p-3">{c.reason}</td>
                      <td className="p-3 text-muted-foreground">{c.doctorName ?? 'Unassigned'}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            c.status === 'COMPLETED'
                              ? 'success'
                              : c.status === 'REQUESTED'
                              ? 'warning'
                              : 'accent'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
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
