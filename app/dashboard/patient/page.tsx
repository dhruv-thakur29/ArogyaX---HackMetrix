import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Pill,
  Siren,
  Stethoscope,
  Syringe,
  AlertTriangle,
} from 'lucide-react'

import { getPatientByUserId } from '@/lib/services/patientService'
import { getConsultationsByPatient } from '@/lib/services/consultationService'
import { getPrescriptionsByPatient } from '@/lib/services/prescriptionService'
import { getVaccinationsByPatient } from '@/lib/services/vaccinationService'
import { getVitalsByPatient } from '@/lib/services/vitalsService'
import { getEmergencyReferralsByPatient } from '@/lib/services/emergencyService'

export default async function PatientDashboardPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'patient') redirect(dashboardPathForRole(session.role))

  // Fetch patient profile & records
  const patient = await getPatientByUserId(session.id)
  const patientId = patient?.id ?? 'pat_1'

  const consultations = await getConsultationsByPatient(patientId)
  const prescriptions = await getPrescriptionsByPatient(patientId)
  const vaccinations = await getVaccinationsByPatient(patientId)
  const vitals = await getVitalsByPatient(patientId)
  const emergencyReferrals = await getEmergencyReferralsByPatient(patientId)

  const upcomingConsultation = consultations.find(
    (c) => c.status === 'REQUESTED' || c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS'
  )
  const recentConsultation = consultations.find((c) => c.status === 'COMPLETED')
  const overdueVaccine = vaccinations.find((v) => v.status === 'OVERDUE')
  const activeReferral = emergencyReferrals.find((r) => r.status !== 'RESOLVED')
  const latestVitals = vitals[0]

  return (
    <DashboardShell user={session} title="Patient Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background text-primary">
                  {patient?.village ? `Village: ${patient.village}` : 'Patient Portal'}
                </Badge>
                <span className="text-xs text-muted-foreground">ID: {patientId}</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground md:text-3xl">
                Namaste, {session.name}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Your health status is being monitored. Connect with healthcare workers and doctors or check your symptoms anytime.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/patient/symptom-checker" className={buttonVariants({ size: 'sm' })}>
                <Activity className="mr-1.5 h-4 w-4" /> Symptom Checker
              </Link>
              <Link href="/dashboard/patient/consultations" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <Stethoscope className="mr-1.5 h-4 w-4" /> Request Doctor
              </Link>
            </div>
          </div>
        </div>

        {/* Emergency Alert Banner if active emergency */}
        {activeReferral && (
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 animate-bounce" />
              <div>
                <p className="font-semibold text-sm">Active Emergency Referral Recorded</p>
                <p className="text-xs opacity-90">
                  Hospital: {activeReferral.hospitalName} &middot; Status: {activeReferral.status}
                </p>
              </div>
            </div>
            <Link href="/dashboard/patient/emergency" className={buttonVariants({ variant: 'destructive', size: 'sm' })}>
              View Emergency Status
            </Link>
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Health Status Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vitals Status
              </CardTitle>
              <HeartPulse className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {latestVitals ? `${latestVitals.bloodPressureSys}/${latestVitals.bloodPressureDia} mmHg` : 'Normal'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestVitals ? `SpO2: ${latestVitals.oxygenSatPercent}% · Pulse: ${latestVitals.heartRateBpm} bpm` : 'No recent vitals logged'}
              </p>
            </CardContent>
          </Card>

          {/* Active Prescriptions Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prescriptions
              </CardTitle>
              <Pill className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{prescriptions.length} Active</div>
              <p className="text-xs text-muted-foreground mt-1">
                {prescriptions[0] ? `${prescriptions[0].medicines.length} medicine(s) prescribed` : 'No active prescriptions'}
              </p>
            </CardContent>
          </Card>

          {/* Consultation Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Consultations
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{consultations.length} Recorded</div>
              <p className="text-xs text-muted-foreground mt-1">
                {upcomingConsultation ? `Status: ${upcomingConsultation.status}` : 'All consultations completed'}
              </p>
            </CardContent>
          </Card>

          {/* Vaccination Alert Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vaccines
              </CardTitle>
              <Syringe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {overdueVaccine ? (
                  <span className="text-destructive">Overdue</span>
                ) : (
                  <span>Up to Date</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueVaccine ? overdueVaccine.vaccineName : `${vaccinations.length} total vaccines tracked`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active / Recent Consultations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Recent Consultations</CardTitle>
                <CardDescription>Your medical appointments & care plans</CardDescription>
              </div>
              <Link href="/dashboard/patient/consultations" className="text-xs font-medium text-primary hover:underline">
                View all &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {consultations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No consultations requested yet.</p>
              ) : (
                consultations.slice(0, 2).map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{c.reason}</span>
                      <Badge
                        variant={
                          c.status === 'COMPLETED'
                            ? 'success'
                            : c.status === 'REQUESTED'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {c.status}
                      </Badge>
                    </div>
                    {c.doctorName && (
                      <p className="text-xs text-muted-foreground">Doctor: {c.doctorName}</p>
                    )}
                    {c.carePlan && (
                      <p className="text-xs text-foreground bg-muted/40 p-2 rounded border border-border/50">
                        <strong>Care Plan:</strong> {c.carePlan}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Symptom Triage Banner */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">AI Symptom Triage</CardTitle>
              </div>
              <CardDescription>
                Describe your symptoms for instant informational guidance and triage categorization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Enter your symptoms (e.g. fever, chest pain, cough)</li>
                  <li>Get an instant Low / Moderate / Urgent triage rating</li>
                  <li>Receive clinical guidance and emergency referral access</li>
                </ul>
              </div>

              <Link
                href="/dashboard/patient/symptom-checker"
                className={buttonVariants({ className: 'w-full gap-2' })}
              >
                Launch Symptom Checker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}