import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Siren, Hospital, PhoneCall, ShieldAlert } from 'lucide-react'

import { getAllPatients } from '@/lib/services/patientService'
import {
  getEmergencyReferrals,
  createEmergencyReferral,
  DEMO_HOSPITALS,
} from '@/lib/services/emergencyService'

export default async function HealthWorkerEmergencyPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'health_worker') redirect(dashboardPathForRole(session.role))
  const workerName = session.name

  // Server Action to Create Emergency Referral
  async function handleCreateReferral(formData: FormData) {
    'use server'
    const patientId = String(formData.get('patientId'))
    const hospitalName = String(formData.get('hospitalName'))
    const reason = String(formData.get('reason'))
    const severity = String(formData.get('severity')) as 'HIGH' | 'CRITICAL'

    const patients = await getAllPatients()
    const targetPatient = patients.find((p) => p.id === patientId)
    const patientName = targetPatient?.name ?? 'Vikram Singh'

    await createEmergencyReferral({
      patientId,
      patientName,
      reportedBy: `${workerName} (Health Worker)`,
      reporterRole: 'health_worker',
      reason,
      severity,
      hospitalName,
      status: 'DISPATCHED',
    })

    redirect('/dashboard/health-worker/emergency')
  }

  const patients = await getAllPatients()
  const referrals = await getEmergencyReferrals()

  return (
    <DashboardShell user={session} title="Emergency Referral Protocol">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Emergency Field Referrals
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dispatch urgent patient referrals to sub-divisional hospitals and CHCs.
          </p>
        </div>

        {/* Emergency Form Card */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <Siren className="h-5 w-5 animate-pulse" /> Dispatch Emergency Referral
            </CardTitle>
            <CardDescription>Initiate transport and hospital admission alert for critical patients.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleCreateReferral} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <label htmlFor="patientId" className="block font-semibold text-foreground mb-1">
                    Select Patient *
                  </label>
                  <select
                    id="patientId"
                    name="patientId"
                    required
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Age: {p.age}, Village: {p.village})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="hospitalName" className="block font-semibold text-foreground mb-1">
                    Select Referral Hospital *
                  </label>
                  <select
                    id="hospitalName"
                    name="hospitalName"
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  >
                    {DEMO_HOSPITALS.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name} ({h.distance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="severity" className="block font-semibold text-foreground mb-1">
                    Triage Severity *
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Transport)</option>
                    <option value="HIGH">HIGH (Urgent Review)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-xs font-semibold text-foreground mb-1">
                  Reason for Referral / Symptoms *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  placeholder="e.g. Acute abdominal pain, severe breathlessness, high trauma..."
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="destructive" className="gap-2 font-bold text-xs">
                  <Siren className="h-4 w-4" /> DISPATCH EMERGENCY REFERRAL
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Referrals Log */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Referrals Log Archive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referrals.map((r) => (
              <div key={r.id} className="p-3.5 rounded-xl border border-destructive/20 bg-card text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{r.patientName}</span>
                  <Badge variant="destructive">{r.severity} &middot; {r.status}</Badge>
                </div>
                <p className="text-muted-foreground">
                  Target Facility: <strong>{r.hospitalName}</strong> &middot; Dispatched By: {r.reportedBy}
                </p>
                <p className="text-foreground"><strong>Reason:</strong> {r.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
