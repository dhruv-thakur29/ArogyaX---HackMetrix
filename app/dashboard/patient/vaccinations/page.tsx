import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle, Syringe, Calendar } from 'lucide-react'

import { getPatientByUserId } from '@/lib/services/patientService'
import { getVaccinationsByPatient } from '@/lib/services/vaccinationService'

export default async function PatientVaccinationsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'patient') redirect(dashboardPathForRole(session.role))

  const patient = await getPatientByUserId(session.id)
  const patientId = patient?.id ?? 'pat_1'

  const vaccinations = await getVaccinationsByPatient(patientId)

  const completed = vaccinations.filter((v) => v.status === 'COMPLETED')
  const upcoming = vaccinations.filter((v) => v.status === 'UPCOMING')
  const overdue = vaccinations.filter((v) => v.status === 'OVERDUE')

  return (
    <DashboardShell user={session} title="Vaccinations & Immunization Timeline">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Vaccination Tracker
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your completed vaccines, upcoming due dates, and immunizations logged by health workers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{completed.length}</div>
              <p className="text-xs text-muted-foreground">Immunizations done</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{upcoming.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled doses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdue.length}</div>
              <p className="text-xs text-muted-foreground">Action required</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Syringe className="h-5 w-5 text-purple-600" /> Immunization Timeline
            </CardTitle>
            <CardDescription>Chronological log of your health center vaccine history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vaccinations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No vaccination records found.</p>
            ) : (
              vaccinations.map((vac) => (
                <div key={vac.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                  <div
                    className={`p-2.5 rounded-full shrink-0 ${
                      vac.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : vac.status === 'OVERDUE'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-blue-500/10 text-blue-600'
                    }`}
                  >
                    {vac.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : vac.status === 'OVERDUE' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-foreground">{vac.vaccineName}</h4>
                      <Badge
                        variant={
                          vac.status === 'COMPLETED'
                            ? 'success'
                            : vac.status === 'OVERDUE'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {vac.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {vac.status === 'COMPLETED'
                        ? `Administered on ${vac.administeredDate} by ${vac.administeredBy || 'Health Worker'}`
                        : `Scheduled due date: ${vac.dueDate}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
