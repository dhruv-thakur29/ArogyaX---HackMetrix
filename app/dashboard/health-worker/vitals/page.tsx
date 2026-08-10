import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, HeartPulse, Plus, CheckCircle2 } from 'lucide-react'

import { getAllPatients, getPatientById } from '@/lib/services/patientService'
import { getAllVitals, recordVitals } from '@/lib/services/vitalsService'

export default async function HealthWorkerVitalsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'health_worker') redirect(dashboardPathForRole(session.role))
  const workerName = session.name

  // Server Action to Record Vitals
  async function handleRecordVitals(formData: FormData) {
    'use server'
    const patientId = String(formData.get('patientId'))
    const temp = Number(formData.get('temperatureCelsius'))
    const sys = Number(formData.get('bloodPressureSys'))
    const dia = Number(formData.get('bloodPressureDia'))
    const heart = Number(formData.get('heartRateBpm'))
    const o2 = Number(formData.get('oxygenSatPercent'))

    const patient = await getPatientById(patientId)
    const patientName = patient?.name ?? 'Unknown Patient'

    if (patientId) {
      await recordVitals({
        patientId,
        patientName,
        temperatureCelsius: temp,
        bloodPressureSys: sys,
        bloodPressureDia: dia,
        heartRateBpm: heart,
        oxygenSatPercent: o2,
        recordedBy: `${workerName} (Health Worker)`,
      })
      redirect('/dashboard/health-worker/vitals')
    }
  }

  const patients = await getAllPatients()
  const vitals = await getAllVitals()

  return (
    <DashboardShell user={session} title="Record &amp; Monitor Patient Vitals">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Collect Vital Signs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Record physiological measurements for patients during home visits or health posts.
          </p>
        </div>

        {/* Record Vitals Form Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-500" /> Log Clinical Vitals Entry
            </CardTitle>
            <CardDescription>Enter measured values for body temperature, BP, pulse, and oxygen.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleRecordVitals} className="space-y-4">
              <div>
                <label htmlFor="patientId" className="block text-xs font-semibold text-foreground mb-1">
                  Select Patient *
                </label>
                <select
                  id="patientId"
                  name="patientId"
                  required
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Age: {p.age}, Village: {p.village})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-5 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Systolic BP (mmHg) *
                  </label>
                  <input
                    type="number"
                    name="bloodPressureSys"
                    min={50}
                    max={250}
                    required
                    defaultValue={120}
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Diastolic BP (mmHg) *
                  </label>
                  <input
                    type="number"
                    name="bloodPressureDia"
                    min={30}
                    max={150}
                    required
                    defaultValue={80}
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Body Temp (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperatureCelsius"
                    min={30}
                    max={45}
                    required
                    defaultValue={37.0}
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Heart Rate (bpm) *
                  </label>
                  <input
                    type="number"
                    name="heartRateBpm"
                    min={30}
                    max={220}
                    required
                    defaultValue={72}
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Oxygen SpO2 (%) *
                  </label>
                  <input
                    type="number"
                    name="oxygenSatPercent"
                    min={50}
                    max={100}
                    required
                    defaultValue={98}
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="gap-2 font-semibold">
                  <Activity className="h-4 w-4" /> Save Vitals Entry
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Vitals History Log Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Vitals Logs Archive</CardTitle>
            <CardDescription>Recent vitals captured across community patients.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-2.5">Date &amp; Time</th>
                    <th className="p-2.5">Patient Name</th>
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
                      <td className="p-2.5 font-bold text-foreground">{v.patientName}</td>
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
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
