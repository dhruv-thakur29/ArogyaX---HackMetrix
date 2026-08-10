import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Stethoscope, User, FileText, Calendar } from 'lucide-react'

import { getPatientByUserId } from '@/lib/services/patientService'
import { getConsultationsByPatient, requestConsultation } from '@/lib/services/consultationService'
import { getPrescriptionByConsultation } from '@/lib/services/prescriptionService'
import { getFollowUpsByPatient } from '@/lib/services/followUpService'

export default async function PatientConsultationsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'patient') redirect(dashboardPathForRole(session.role))

  const patient = await getPatientByUserId(session.id)
  const patientId = patient?.id ?? 'pat_1'
  const patientName = session.name

  // Server Action to request new consultation
  async function handleRequestConsultation(formData: FormData) {
    'use server'
    const reason = String(formData.get('reason') ?? '')
    if (reason.trim()) {
      await requestConsultation(patientId, patientName, reason)
      redirect('/dashboard/patient/consultations')
    }
  }

  const rawConsultations = await getConsultationsByPatient(patientId)

  // Pre-fetch prescriptions and follow-ups to avoid async map inside JSX
  const consultationList = await Promise.all(
    rawConsultations.map(async (c) => {
      const prescription = await getPrescriptionByConsultation(c.id)
      const followUps = await getFollowUpsByPatient(patientId)
      const matchingFollowUp = followUps.find((f) => f.consultationId === c.id) ?? null
      return {
        consultation: c,
        prescription,
        followUp: matchingFollowUp,
      }
    })
  )

  return (
    <DashboardShell user={session} title="Doctor Consultations">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Your Consultation Workflow
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Request tele-consultations with available doctors, track queue status, and access care plans.
          </p>
        </div>

        {/* Request Consultation Form Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Request New Consultation
            </CardTitle>
            <CardDescription>
              Submit your reason or chief complaint to get placed in the doctor&apos;s queue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleRequestConsultation} className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-xs font-semibold text-foreground mb-1.5">
                  Describe your health concern or symptoms:
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  placeholder="e.g. Severe headache since morning, mild fever (38.5 C) and joint aches..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2 font-semibold">
                  <Stethoscope className="h-4 w-4" /> Submit Consultation Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Consultations List */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Consultation History ({consultationList.length})
          </h3>

          {consultationList.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-muted-foreground">No consultation requests found.</p>
            </Card>
          ) : (
            consultationList.map(({ consultation: c, prescription: rx, followUp }) => (
              <Card key={c.id} className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                        className="font-bold text-xs"
                      >
                        {c.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">ID: {c.id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">{c.reason}</CardTitle>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-sm">
                  {c.doctorName ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <User className="h-4 w-4 text-primary" />
                      <span>Attending Doctor: <strong>{c.doctorName}</strong></span>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium">
                      Waiting for doctor to pick up from queue...
                    </p>
                  )}

                  {c.notes && (
                    <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-1 text-xs">
                      <p className="font-semibold text-foreground">Doctor Notes:</p>
                      <p className="text-muted-foreground">{c.notes}</p>
                    </div>
                  )}

                  {c.carePlan && (
                    <div className="rounded-lg bg-primary/5 p-3 border border-primary/20 space-y-1 text-xs">
                      <p className="font-semibold text-primary">Care Plan &amp; Recommendations:</p>
                      <p className="text-foreground">{c.carePlan}</p>
                    </div>
                  )}

                  {rx && (
                    <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> Prescribed Medicines ({rx.medicines.length})
                        </p>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {rx.medicines.map((m) => (
                          <li key={m.id}>
                            <strong>{m.name}</strong> &mdash; {m.dosage}, {m.frequency} for {m.durationDays} days.
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {followUp && (
                    <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20 text-xs space-y-1">
                      <p className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Follow-up Scheduled: {followUp.dueDate}
                      </p>
                      <p className="text-muted-foreground">Reason: {followUp.reason}</p>
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
