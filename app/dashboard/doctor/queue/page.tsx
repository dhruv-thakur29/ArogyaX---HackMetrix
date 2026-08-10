import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Stethoscope,
  Users,
  CheckCircle2,
  Clock,
  Pill,
  FileText,
  HeartPulse,
  Syringe,
  Calendar,
} from 'lucide-react'

import {
  getAllConsultations,
  updateConsultationStatus,
} from '@/lib/services/consultationService'
import { createPrescription, getPrescriptionByConsultation } from '@/lib/services/prescriptionService'
import { getVitalsByPatient } from '@/lib/services/vitalsService'
import { getVaccinationsByPatient } from '@/lib/services/vaccinationService'
import { createFollowUp, getFollowUpsByPatient } from '@/lib/services/followUpService'

export default async function DoctorQueuePage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'doctor') redirect(dashboardPathForRole(session.role))

  const doctorId = session.id
  const doctorName = session.name

  // Server Action to Accept Consultation
  async function handleAcceptConsultation(formData: FormData) {
    'use server'
    const consultationId = String(formData.get('consultationId'))
    await updateConsultationStatus(consultationId, 'ACCEPTED', doctorId, doctorName)
    redirect('/dashboard/doctor/queue')
  }

  // Server Action to Complete Consultation & Issue Prescription & Follow-up
  async function handleCompleteConsultation(formData: FormData) {
    'use server'
    const consultationId = String(formData.get('consultationId'))
    const patientId = String(formData.get('patientId'))
    const patientName = String(formData.get('patientName'))
    const notes = String(formData.get('notes') ?? '')
    const carePlan = String(formData.get('carePlan') ?? '')

    const medName = String(formData.get('medName') ?? '')
    const medDosage = String(formData.get('medDosage') ?? '')
    const medFreq = String(formData.get('medFreq') ?? '')
    const medDuration = Number(formData.get('medDuration') ?? 5)
    const medInstructions = String(formData.get('medInstructions') ?? '')

    const followUpDate = String(formData.get('followUpDate') ?? '')
    const followUpReason = String(formData.get('followUpReason') ?? '')

    // Update consultation notes & status to COMPLETED
    await updateConsultationStatus(
      consultationId,
      'COMPLETED',
      doctorId,
      doctorName,
      notes,
      carePlan
    )

    // Create prescription if medicine details provided
    if (medName.trim()) {
      await createPrescription({
        consultationId,
        patientId,
        patientName,
        doctorId,
        doctorName,
        medicines: [
          {
            name: medName.trim(),
            dosage: medDosage.trim() || '1 tablet',
            frequency: medFreq.trim() || 'Twice daily (BD)',
            durationDays: medDuration,
            instructions: medInstructions.trim() || 'Take after meals.',
          },
        ],
      })
    }

    // Create follow-up if follow-up date provided
    if (followUpDate.trim()) {
      await createFollowUp({
        consultationId,
        patientId,
        patientName,
        doctorId,
        doctorName,
        dueDate: followUpDate.trim(),
        reason: followUpReason.trim() || 'Post-consultation evaluation & progress review.',
        notes: `Scheduled during consultation: ${notes.slice(0, 80)}`,
      })
    }

    redirect('/dashboard/doctor/queue')
  }

  const rawConsultations = await getAllConsultations()

  // Pre-fetch async details to avoid async map inside JSX
  const queueData = await Promise.all(
    rawConsultations.map(async (c) => {
      const vitals = await getVitalsByPatient(c.patientId)
      const vaccinations = await getVaccinationsByPatient(c.patientId)
      const rx = await getPrescriptionByConsultation(c.id)
      const followUps = await getFollowUpsByPatient(c.patientId)
      return {
        consultation: c,
        latestVitals: vitals[0] ?? null,
        vaccineCount: vaccinations.length,
        completedVaccines: vaccinations.filter((v) => v.status === 'COMPLETED').length,
        prescription: rx,
        followUps,
      }
    })
  )

  return (
    <DashboardShell user={session} title="Patient Queue &amp; Consultation Suite">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Clinical Patient Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Accept pending requests, review patient vitals &amp; history, and complete consultations with structured prescriptions &amp; follow-up scheduling.
          </p>
        </div>

        {queueData.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Queue is empty</p>
            <p className="text-xs text-muted-foreground mt-1">
              New consultation requests from patients will appear here automatically.
            </p>
          </Card>
        ) : (
          queueData.map(({ consultation: c, latestVitals, vaccineCount, completedVaccines, prescription: rx, followUps }) => (
            <Card id={c.id} key={c.id} className="overflow-hidden border-border shadow-sm">
              <CardHeader className="bg-muted/20 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {c.patientName.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {c.patientName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Patient ID: {c.patientId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        c.status === 'COMPLETED'
                          ? 'success'
                          : c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS'
                          ? 'accent'
                          : 'warning'
                      }
                      className="font-bold text-xs"
                    >
                      {c.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-sm">
                {/* Chief Complaint / Reason */}
                <div className="rounded-lg bg-background p-3 border border-border space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Chief Complaint / Reason for Consultation:
                  </p>
                  <p className="text-sm font-semibold text-foreground">{c.reason}</p>
                </div>

                {/* Patient Vitals & Vaccine History Preview */}
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-lg bg-muted/30 p-3 border border-border space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <HeartPulse className="h-3.5 w-3.5 text-red-500" /> Latest Vitals Log:
                    </p>
                    {latestVitals ? (
                      <p className="text-muted-foreground">
                        BP: <strong>{latestVitals.bloodPressureSys}/{latestVitals.bloodPressureDia} mmHg</strong> &middot; Temp: <strong>{latestVitals.temperatureCelsius}°C</strong> &middot; SpO2: <strong>{latestVitals.oxygenSatPercent}%</strong>
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No vitals logged yet.</p>
                    )}
                  </div>

                  <div className="rounded-lg bg-muted/30 p-3 border border-border space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Syringe className="h-3.5 w-3.5 text-purple-600" /> Vaccination Status:
                    </p>
                    <p className="text-muted-foreground">
                      {vaccineCount > 0
                        ? `${completedVaccines}/${vaccineCount} vaccines completed`
                        : 'No vaccine records.'}
                    </p>
                  </div>
                </div>

                {/* Action Forms based on Status */}
                {c.status === 'REQUESTED' && (
                  <form action={handleAcceptConsultation} className="pt-2 flex justify-end">
                    <input type="hidden" name="consultationId" value={c.id} />
                    <Button type="submit" className="gap-2 font-semibold">
                      <Stethoscope className="h-4 w-4" /> Accept &amp; Start Consultation
                    </Button>
                  </form>
                )}

                {(c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS') && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" /> Complete Consultation &amp; Issue Care Plan
                    </h4>

                    <form action={handleCompleteConsultation} className="space-y-4">
                      <input type="hidden" name="consultationId" value={c.id} />
                      <input type="hidden" name="patientId" value={c.patientId} />
                      <input type="hidden" name="patientName" value={c.patientName} />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Clinical Diagnosis &amp; Notes:
                          </label>
                          <textarea
                            name="notes"
                            required
                            placeholder="Clinical findings, diagnosis, and observations..."
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background p-2.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Care Plan &amp; Advice:
                          </label>
                          <textarea
                            name="carePlan"
                            required
                            placeholder="Rest, hydration, dietary advice..."
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background p-2.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Prescription Form Section */}
                      <div className="border-t border-border/60 pt-3 space-y-2">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1">
                          <Pill className="h-3.5 w-3.5 text-emerald-600" /> Prescribe Medicine:
                        </p>

                        <div className="grid gap-2 sm:grid-cols-4 text-xs">
                          <div>
                            <input
                              type="text"
                              name="medName"
                              placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                              className="w-full rounded border border-input p-2 bg-background"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              name="medDosage"
                              placeholder="Dosage (e.g. 1 Tablet)"
                              className="w-full rounded border border-input p-2 bg-background"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              name="medFreq"
                              placeholder="Frequency (e.g. TDS / Thrice Daily)"
                              className="w-full rounded border border-input p-2 bg-background"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              name="medDuration"
                              placeholder="Duration (Days)"
                              defaultValue={5}
                              className="w-full rounded border border-input p-2 bg-background"
                            />
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            name="medInstructions"
                            placeholder="Special Instructions (e.g. Take after meals with warm water)"
                            className="w-full rounded border border-input p-2 text-xs bg-background"
                          />
                        </div>
                      </div>

                      {/* Schedule Follow-up Section */}
                      <div className="border-t border-border/60 pt-3 space-y-2">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" /> Schedule Required Follow-up:
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2 text-xs">
                          <div>
                            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                              Follow-up Date:
                            </label>
                            <input
                              type="date"
                              name="followUpDate"
                              className="w-full rounded border border-input p-2 bg-background"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                              Reason for Follow-up:
                            </label>
                            <input
                              type="text"
                              name="followUpReason"
                              placeholder="e.g. Re-evaluate BP or fever response"
                              className="w-full rounded border border-input p-2 bg-background"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" variant="default" className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Save Record &amp; Complete Consultation
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {c.status === 'COMPLETED' && (
                  <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-xs space-y-1.5">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">
                      Consultation Completed by {c.doctorName}
                    </p>
                    {c.notes && <p className="text-muted-foreground"><strong>Notes:</strong> {c.notes}</p>}
                    {c.carePlan && <p className="text-muted-foreground"><strong>Care Plan:</strong> {c.carePlan}</p>}
                    {rx && (
                      <p className="text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                        Prescription issued: {rx.medicines.map((m) => m.name).join(', ')}
                      </p>
                    )}
                    {followUps.length > 0 && (
                      <p className="text-blue-700 dark:text-blue-400 font-semibold">
                        Follow-up Scheduled: {followUps[0].dueDate} ({followUps[0].reason})
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  )
}
