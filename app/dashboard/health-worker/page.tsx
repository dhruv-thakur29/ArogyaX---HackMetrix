import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Users,
  Activity,
  Syringe,
  Siren,
  WifiOff,
  UserPlus,
  HeartPulse,
  Plus,
  ArrowRight,
} from 'lucide-react'

import { getAllPatients } from '@/lib/services/patientService'
import { getAllVitals } from '@/lib/services/vitalsService'
import { getAllVaccinations } from '@/lib/services/vaccinationService'
import { getEmergencyReferrals } from '@/lib/services/emergencyService'

export default async function HealthWorkerDashboardPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'health_worker') redirect(dashboardPathForRole(session.role))

  const patients = await getAllPatients()
  const vitals = await getAllVitals()
  const vaccinations = await getAllVaccinations()
  const emergencyReferrals = await getEmergencyReferrals()

  const pendingVaccines = vaccinations.filter((v) => v.status === 'UPCOMING' || v.status === 'OVERDUE')

  return (
    <DashboardShell user={session} title="Community Health Worker Portal">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge variant="outline" className="bg-background text-primary mb-2">
                Field Health Worker Hub
              </Badge>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Namaste, {session.name}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Register patients, log vital signs, update immunization schedules, and handle emergency referrals in field clinics.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/health-worker/patients" className={buttonVariants({ size: 'sm', className: 'gap-1.5' })}>
                <UserPlus className="h-4 w-4" /> Register Patient
              </Link>
              <Link href="/dashboard/health-worker/vitals" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}>
                <Activity className="h-4 w-4" /> Record Vitals
              </Link>
            </div>
          </div>
        </div>

        {/* Action Task Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Registered Patients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{patients.length} Registered</div>
              <p className="text-xs text-muted-foreground mt-1">Village population directory</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Vitals Logged</CardTitle>
              <HeartPulse className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{vitals.length} Records</div>
              <p className="text-xs text-muted-foreground mt-1">Field observations</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Vaccine Due</CardTitle>
              <Syringe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{pendingVaccines.length} Pending</div>
              <p className="text-xs text-muted-foreground mt-1">Immunization tasks</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Emergency Referrals</CardTitle>
              <Siren className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{emergencyReferrals.length} Cases</div>
              <p className="text-xs text-muted-foreground mt-1">Hospital dispatches</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Patient Registration
              </CardTitle>
              <CardDescription>Add new synthetic patient profiles into the system repository.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/health-worker/patients" className={buttonVariants({ className: 'w-full gap-2' })}>
                Go to Patient Registry <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" /> Vitals &amp; Health Checks
              </CardTitle>
              <CardDescription>Log temperature, blood pressure, heart rate, and oxygen levels.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/health-worker/vitals" className={buttonVariants({ variant: 'outline', className: 'w-full gap-2' })}>
                Record Vitals <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-amber-600" /> Offline Queue Manager
              </CardTitle>
              <CardDescription>View data captured offline in field conditions and trigger sync.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/health-worker/offline" className={buttonVariants({ variant: 'outline', className: 'w-full gap-2' })}>
                View Offline Queue <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}