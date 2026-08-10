import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pill, Clock, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'

import { getPatientByUserId } from '@/lib/services/patientService'
import { getPrescriptionsByPatient } from '@/lib/services/prescriptionService'

export default async function PatientPrescriptionsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'patient') redirect(dashboardPathForRole(session.role))

  const patient = await getPatientByUserId(session.id)
  const patientId = patient?.id ?? 'pat_1'

  const prescriptions = await getPrescriptionsByPatient(patientId)

  return (
    <DashboardShell user={session} title="Prescriptions">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Active &amp; Past Prescriptions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review medicine dosages, daily frequencies, and instructions prescribed by your attending doctors.
          </p>
        </div>

        {prescriptions.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Pill className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No prescriptions found.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Prescriptions issued during consultations will automatically appear here.
            </p>
          </Card>
        ) : (
          prescriptions.map((rx) => (
            <Card key={rx.id} className="overflow-hidden">
              <CardHeader className="bg-muted/20 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-base font-semibold">Prescription #{rx.id}</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Issued: {new Date(rx.createdAt).toLocaleDateString()} &middot; Doctor: <strong>{rx.doctorName}</strong>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  {rx.medicines.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{m.name}</h4>
                          <Badge variant="outline" className="text-xs">{m.dosage}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <strong>Frequency:</strong> {m.frequency} &middot; <strong>Duration:</strong> {m.durationDays} days
                        </p>
                        {m.instructions && (
                          <p className="text-xs text-foreground bg-muted/30 px-2.5 py-1 rounded border border-border/40 mt-1">
                            <em>Instructions:</em> {m.instructions}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <Badge variant="success" className="text-xs">Active Medication</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  )
}
