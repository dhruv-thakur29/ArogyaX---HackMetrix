import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Siren, PhoneCall, MapPin, Hospital, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'

import { getPatientByUserId } from '@/lib/services/patientService'
import {
  getEmergencyReferralsByPatient,
  createEmergencyReferral,
  DEMO_HOSPITALS,
} from '@/lib/services/emergencyService'

export default async function PatientEmergencyPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'patient') redirect(dashboardPathForRole(session.role))

  const patient = await getPatientByUserId(session.id)
  const patientId = patient?.id ?? 'pat_1'
  const patientName = session.name

  // Server Action to trigger emergency referral
  async function handleEmergencyTrigger(formData: FormData) {
    'use server'
    const hospitalName = String(formData.get('hospitalName') ?? DEMO_HOSPITALS[0].name)
    const reason = String(formData.get('reason') ?? 'Acute emergency triage escalation requested by patient.')

    await createEmergencyReferral({
      patientId,
      patientName,
      reportedBy: patientName,
      reporterRole: 'patient',
      reason,
      severity: 'CRITICAL',
      hospitalName,
      status: 'PENDING',
    })

    redirect('/dashboard/patient/emergency')
  }

  const referrals = await getEmergencyReferralsByPatient(patientId)

  return (
    <DashboardShell user={session} title="Emergency Referral & Hospital Services">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Warning Banner */}
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/20 text-destructive shrink-0">
              <Siren className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-destructive">
                Emergency Triage &amp; Referral Protocol
              </h2>
              <p className="text-xs leading-relaxed text-destructive/90">
                If you or someone around you is experiencing life-threatening symptoms (e.g., severe chest pain, loss of consciousness, uncontrolled bleeding), tap <strong>Trigger Emergency Ambulance Referral</strong> immediately below.
              </p>
              <p className="text-[11px] opacity-75 font-mono pt-1">
                * Note: Hospital data and referral dispatches are simulated for this prototype demo.
              </p>
            </div>
          </div>
        </div>

        {/* Trigger Emergency Action Card */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Dispatch Emergency Ambulance Referral
            </CardTitle>
            <CardDescription>
              This action immediately flags your profile to local health workers and dispatches emergency routing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleEmergencyTrigger} className="space-y-4">
              <div>
                <label htmlFor="hospitalName" className="block text-xs font-semibold text-foreground mb-1.5">
                  Select Target Emergency Facility:
                </label>
                <select
                  id="hospitalName"
                  name="hospitalName"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:border-destructive focus:ring-1 focus:ring-destructive"
                >
                  {DEMO_HOSPITALS.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} ({h.distance} &middot; {h.bedsAvailable} Beds Available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reason" className="block text-xs font-semibold text-foreground mb-1.5">
                  Emergency Notes / Symptoms:
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  defaultValue="Acute chest pain and severe shortness of breath."
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:border-destructive focus:ring-1 focus:ring-destructive"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="destructive" className="gap-2 font-bold text-sm">
                  <Siren className="h-4 w-4 animate-bounce" />
                  CONFIRM EMERGENCY REFERRAL DISPATCH
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Active & Past Referrals */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Emergency Referral History ({referrals.length})
          </h3>

          {referrals.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <p className="text-xs text-muted-foreground">No emergency referrals recorded for this account.</p>
            </Card>
          ) : (
            referrals.map((ref) => (
              <Card key={ref.id} className="overflow-hidden border-destructive/20">
                <CardHeader className="bg-destructive/5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive" className="font-bold text-xs">
                      {ref.severity} SEVERITY &middot; {ref.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(ref.createdAt).toLocaleString()}</span>
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground mt-2">
                    {ref.hospitalName}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-3 text-xs space-y-2">
                  <p className="text-muted-foreground">
                    <strong>Reported Reason:</strong> {ref.reason}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Dispatched By:</strong> {ref.reportedBy} ({ref.reporterRole})
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Simulated Nearby Hospitals Grid */}
        <div className="space-y-3">
          <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <Hospital className="h-4 w-4 text-primary" /> Nearby Network Hospitals &amp; Emergency Hubs
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            {DEMO_HOSPITALS.map((hosp) => (
              <Card key={hosp.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                    {hosp.name}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> {hosp.distance} away
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Emergency Bed Availability:</span>
                    <Badge variant="success">{hosp.bedsAvailable} Beds</Badge>
                  </div>
                  <div className="flex items-center justify-between font-mono font-medium text-foreground pt-1 border-t border-border">
                    <span className="flex items-center gap-1">
                      <PhoneCall className="h-3 w-3 text-emerald-600" /> Helpline:
                    </span>
                    <span>{hosp.emergencyContact}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
