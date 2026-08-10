import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Syringe, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

import { getAllPatients } from '@/lib/services/patientService'
import { getAllVaccinations, recordVaccination } from '@/lib/services/vaccinationService'
import type { VaccineStatus } from '@/lib/types'

export default async function HealthWorkerVaccinationsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'health_worker') redirect(dashboardPathForRole(session.role))
  const workerName = session.name

  // Server Action to Record / Update Vaccination
  async function handleRecordVaccine(formData: FormData) {
    'use server'
    const patientId = String(formData.get('patientId'))
    const vaccineName = String(formData.get('vaccineName'))
    const status = String(formData.get('status')) as VaccineStatus
    const date = String(formData.get('date') ?? new Date().toISOString().split('T')[0])

    const patients = await getAllPatients()
    const targetPatient = patients.find((p) => p.id === patientId)
    const patientName = targetPatient?.name ?? 'Asha Devi'

    await recordVaccination(
      patientId,
      patientName,
      vaccineName,
      status,
      status !== 'COMPLETED' ? date : undefined,
      status === 'COMPLETED' ? date : undefined,
      workerName
    )

    redirect('/dashboard/health-worker/vaccinations')
  }

  const patients = await getAllPatients()
  const vaccinations = await getAllVaccinations()

  return (
    <DashboardShell user={session} title="Vaccination &amp; Immunization Logging">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Vaccination Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administer vaccines, update immunization schedules, and track village coverage.
          </p>
        </div>

        {/* Record Vaccine Form */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Syringe className="h-5 w-5 text-purple-600" /> Record Vaccination Dose
            </CardTitle>
            <CardDescription>Select patient and record administered vaccine or scheduled due date.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleRecordVaccine} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <label htmlFor="patientId" className="block font-semibold text-foreground mb-1">
                    Select Patient *
                  </label>
                  <select
                    id="patientId"
                    name="patientId"
                    required
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Village: {p.village})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="vaccineName" className="block font-semibold text-foreground mb-1">
                    Vaccine Name *
                  </label>
                  <input
                    type="text"
                    id="vaccineName"
                    name="vaccineName"
                    required
                    placeholder="e.g. Hepatitis B (Dose 1), Polio, TT"
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block font-semibold text-foreground mb-1">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm"
                  >
                    <option value="COMPLETED">COMPLETED (Administered Today)</option>
                    <option value="UPCOMING">UPCOMING (Scheduled)</option>
                    <option value="OVERDUE">OVERDUE (Missed Dose)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="gap-2 font-semibold">
                  <Syringe className="h-4 w-4" /> Save Vaccination Status
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* All Vaccinations List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Immunization Register</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vaccinations.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card text-xs">
                <div>
                  <p className="font-bold text-sm text-foreground">{v.patientName}</p>
                  <p className="text-muted-foreground">
                    Vaccine: <strong>{v.vaccineName}</strong> &middot;{' '}
                    {v.administeredDate
                      ? `Administered: ${v.administeredDate} by ${v.administeredBy}`
                      : `Due: ${v.dueDate}`}
                  </p>
                </div>
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
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
