import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pill, FileText, User } from 'lucide-react'

import { getAllPrescriptions } from '@/lib/services/prescriptionService'

export default async function DoctorPrescriptionsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'doctor') redirect(dashboardPathForRole(session.role))

  const prescriptions = await getAllPrescriptions()

  return (
    <DashboardShell user={session} title="Prescription Oversight">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Issued Prescriptions Log
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all medications issued to patients across tele-consultations.
          </p>
        </div>

        {prescriptions.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-sm text-muted-foreground">No prescriptions issued yet.</p>
          </Card>
        ) : (
          prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardHeader className="bg-muted/20 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-base font-semibold">
                      Patient: {rx.patientName}
                    </CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(rx.createdAt).toLocaleString()}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-xs">
                <p className="text-muted-foreground">Prescribed By: <strong>{rx.doctorName}</strong></p>
                <div className="space-y-1">
                  {rx.medicines.map((m) => (
                    <div key={m.id} className="rounded bg-muted/40 p-2 border border-border">
                      <p className="font-bold text-foreground">{m.name} ({m.dosage})</p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.frequency} for {m.durationDays} days. {m.instructions}
                      </p>
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
