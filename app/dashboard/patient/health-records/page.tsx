import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, FileText, HeartPulse, Pill, Stethoscope, Syringe, User } from 'lucide-react'

import { getPatientByUserId } from '@/lib/services/patientService'
import { getConsultationsByPatient } from '@/lib/services/consultationService'
import { getPrescriptionsByPatient } from '@/lib/services/prescriptionService'
import { getVaccinationsByPatient } from '@/lib/services/vaccinationService'
import { getVitalsByPatient } from '@/lib/services/vitalsService'

export default async function PatientHealthRecordsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'patient') redirect(dashboardPathForRole(session.role))

  const patient = await getPatientByUserId(session.id)
  const patientId = patient?.id ?? 'pat_1'

  const consultations = await getConsultationsByPatient(patientId)
  const prescriptions = await getPrescriptionsByPatient(patientId)
  const vaccinations = await getVaccinationsByPatient(patientId)
  const vitals = await getVitalsByPatient(patientId)

  return (
    <DashboardShell user={session} title="Health Records & Medical History">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Patient Profile Summary */}
        <Card className="bg-gradient-to-r from-muted/30 to-background border-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {session.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{session.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Age: {patient?.age ?? 34} &middot; Gender: {patient?.gender ?? 'Female'} &middot; Blood Group: {patient?.bloodGroup ?? 'O+'}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Village: <strong>{patient?.village ?? 'Rampur'}</strong></p>
                <p>Registered By: <strong>{patient?.registeredBy ?? 'Sunita Yadav'}</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vitals History Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-red-500" />
                <CardTitle className="text-base font-semibold">Recorded Vitals History</CardTitle>
              </div>
              <Badge variant="outline">{vitals.length} Logs</Badge>
            </div>
            <CardDescription>Vitals recorded during clinic visits or by community health workers.</CardDescription>
          </CardHeader>
          <CardContent>
            {vitals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No vitals logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Date &amp; Time</th>
                      <th className="p-2.5">BP (mmHg)</th>
                      <th className="p-2.5">Temp (°C)</th>
                      <th className="p-2.5">Heart Rate</th>
                      <th className="p-2.5">SpO2 (%)</th>
                      <th className="p-2.5">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vitals.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/20">
                        <td className="p-2.5 font-medium">{new Date(v.recordedAt).toLocaleString()}</td>
                        <td className="p-2.5">{v.bloodPressureSys}/{v.bloodPressureDia}</td>
                        <td className="p-2.5">{v.temperatureCelsius}°C</td>
                        <td className="p-2.5">{v.heartRateBpm} bpm</td>
                        <td className="p-2.5">{v.oxygenSatPercent}%</td>
                        <td className="p-2.5 text-muted-foreground">{v.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clinical History & Prescriptions Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Prescriptions History */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base font-semibold">Active &amp; Past Prescriptions</CardTitle>
              </div>
              <CardDescription>Medicines prescribed by your attending doctor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {prescriptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No prescriptions on record.</p>
              ) : (
                prescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-lg border border-border p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="font-semibold text-foreground">Doctor: {rx.doctorName}</span>
                      <span className="text-muted-foreground">{new Date(rx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-1.5">
                      {rx.medicines.map((m) => (
                        <div key={m.id} className="flex justify-between items-start bg-muted/30 p-2 rounded">
                          <div>
                            <p className="font-semibold text-foreground">{m.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {m.dosage} &middot; {m.frequency}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{m.durationDays} Days</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Vaccination Records */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base font-semibold">Vaccination Record</CardTitle>
              </div>
              <CardDescription>Immunization history and schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {vaccinations.length === 0 ? (
                <p className="text-xs text-muted-foreground">No vaccinations logged.</p>
              ) : (
                vaccinations.map((vac) => (
                  <div key={vac.id} className="flex items-center justify-between p-3 rounded-lg border border-border text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{vac.vaccineName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {vac.administeredDate
                          ? `Given on ${vac.administeredDate} by ${vac.administeredBy}`
                          : `Due on ${vac.dueDate}`}
                      </p>
                    </div>
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
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
