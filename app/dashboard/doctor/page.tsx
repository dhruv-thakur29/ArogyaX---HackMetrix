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
  Stethoscope,
  Clock,
  CheckCircle2,
  FileText,
  Pill,
  ArrowRight,
  Activity,
  Calendar,
} from 'lucide-react'

import { getAllConsultations } from '@/lib/services/consultationService'
import { getAllPatients } from '@/lib/services/patientService'

export default async function DoctorDashboardPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'doctor') redirect(dashboardPathForRole(session.role))

  const consultations = await getAllConsultations()
  const patients = await getAllPatients()

  const pendingRequests = consultations.filter((c) => c.status === 'REQUESTED')
  const activeConsultations = consultations.filter(
    (c) => c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS'
  )
  const completedConsultations = consultations.filter((c) => c.status === 'COMPLETED')

  return (
    <DashboardShell user={session} title="Doctor Clinical Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge variant="outline" className="bg-background text-primary mb-2">
                Tele-Medicine &amp; Clinical Queue
              </Badge>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Welcome back, {session.name}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                You have <strong>{pendingRequests.length} pending consultation requests</strong> waiting in the queue.
              </p>
            </div>

            <Link href="/dashboard/doctor/queue" className={buttonVariants({ size: 'lg', className: 'gap-2 font-bold' })}>
              <Users className="h-5 w-5" /> Open Patient Queue ({pendingRequests.length})
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Pending Queue</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingRequests.length} Patients</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting acceptance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Sessions</CardTitle>
              <Stethoscope className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeConsultations.length} In Progress</div>
              <p className="text-xs text-muted-foreground mt-1">Currently assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{completedConsultations.length} Consultations</div>
              <p className="text-xs text-muted-foreground mt-1">Prescriptions issued</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Registered Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{patients.length} Total</div>
              <p className="text-xs text-muted-foreground mt-1">Community population</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pending Queue List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Pending Patient Queue</CardTitle>
                <CardDescription>Click to view details and accept request</CardDescription>
              </div>
              <Link href="/dashboard/doctor/queue" className="text-xs font-medium text-primary hover:underline">
                View Queue &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No pending requests in queue.</p>
              ) : (
                pendingRequests.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border p-4 space-y-2 bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{c.patientName}</span>
                      <Badge variant="warning">REQUESTED</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      <strong>Reason:</strong> {c.reason}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <Link href={`/dashboard/doctor/queue#${c.id}`} className={buttonVariants({ size: 'sm', className: 'text-xs gap-1' })}>
                        Review &amp; Accept <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Consultations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">In-Progress Consultations</CardTitle>
                <CardDescription>Ongoing patient care sessions</CardDescription>
              </div>
              <Link href="/dashboard/doctor/queue" className="text-xs font-medium text-primary hover:underline">
                Manage &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeConsultations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No active consultations assigned.</p>
              ) : (
                activeConsultations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{c.patientName}</span>
                      <Badge variant="accent">{c.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Chief Complaint:</strong> {c.reason}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <Link href={`/dashboard/doctor/queue#${c.id}`} className={buttonVariants({ size: 'sm', className: 'text-xs gap-1' })}>
                        Write Prescription &amp; Complete
                      </Link>
                    </div>
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