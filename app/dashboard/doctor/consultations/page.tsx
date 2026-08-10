import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { getAllConsultations } from '@/lib/services/consultationService'
import { getPrescriptionByConsultation } from '@/lib/services/prescriptionService'

export default async function DoctorConsultationsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'doctor') redirect(dashboardPathForRole(session.role))

  const rawConsultations = await getAllConsultations()

  const list = await Promise.all(
    rawConsultations.map(async (c) => {
      const rx = await getPrescriptionByConsultation(c.id)
      return { consultation: c, prescription: rx }
    })
  )

  return (
    <DashboardShell user={session} title="Consultation History">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            All Patient Consultations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete archive of patient interactions, diagnoses, and tele-health sessions.
          </p>
        </div>

        <div className="space-y-4">
          {list.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-muted-foreground">No consultations recorded.</p>
            </Card>
          ) : (
            list.map(({ consultation: c, prescription: rx }) => (
              <Card key={c.id}>
                <CardHeader className="bg-muted/20 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-foreground">{c.patientName}</span>
                      <Badge
                        variant={
                          c.status === 'COMPLETED'
                            ? 'success'
                            : c.status === 'IN_PROGRESS'
                            ? 'default'
                            : c.status === 'ACCEPTED'
                            ? 'accent'
                            : 'warning'
                        }
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 text-xs">
                  <p className="text-foreground"><strong>Reason:</strong> {c.reason}</p>
                  {c.notes && <p className="text-muted-foreground"><strong>Notes:</strong> {c.notes}</p>}
                  {c.carePlan && <p className="text-muted-foreground"><strong>Care Plan:</strong> {c.carePlan}</p>}
                  {rx && (
                    <div className="rounded bg-emerald-500/10 p-2 text-emerald-800 dark:text-emerald-300">
                      <strong>Prescription Issued:</strong> {rx.medicines.map((m) => m.name).join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
