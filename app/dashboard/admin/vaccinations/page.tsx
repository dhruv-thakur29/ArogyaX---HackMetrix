import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Syringe } from 'lucide-react'

import { getAllVaccinations } from '@/lib/services/vaccinationService'

export default async function AdminVaccinationsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect(dashboardPathForRole(session.role))

  const vaccinations = await getAllVaccinations()

  return (
    <DashboardShell user={session} title="Vaccination Coverage Statistics">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Platform Immunization Audit
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track village vaccination coverage rates, completed immunizations, and overdue doses.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Immunization Audit Log ({vaccinations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Vaccine Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Administered / Due Date</th>
                    <th className="p-3">Administered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vaccinations.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/20">
                      <td className="p-3 font-bold text-foreground">{v.patientName}</td>
                      <td className="p-3 font-medium">{v.vaccineName}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            v.status === 'COMPLETED'
                              ? 'success'
                              : v.status === 'OVERDUE'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {v.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {v.administeredDate ? `Given ${v.administeredDate}` : `Due ${v.dueDate}`}
                      </td>
                      <td className="p-3 text-muted-foreground">{v.administeredBy ?? 'Health Worker'}</td>
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
