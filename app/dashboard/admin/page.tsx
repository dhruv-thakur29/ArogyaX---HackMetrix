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
  Syringe,
  Siren,
  BarChart3,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

import { getAdminKPIs, getAnalyticsData } from '@/lib/services/analyticsService'

export default async function AdminDashboardPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect(dashboardPathForRole(session.role))

  const kpis = await getAdminKPIs()
  const analytics = await getAnalyticsData()

  return (
    <DashboardShell user={session} title="Admin Command Center">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge variant="outline" className="bg-background text-primary mb-2">
                Platform Operations &amp; Oversight
              </Badge>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                ArogyaX System Overview
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Live monitoring across village clinics, tele-consultations, health worker registries, and emergency hospital dispatches.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/admin/analytics" className={buttonVariants({ size: 'sm', className: 'gap-1.5' })}>
                <BarChart3 className="h-4 w-4" /> Full Analytics
              </Link>
              <Link href="/dashboard/admin/users" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}>
                <Users className="h-4 w-4" /> Manage Users
              </Link>
            </div>
          </div>
        </div>

        {/* 6 Core KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpis.totalPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered across villages</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Tele-Consultations</CardTitle>
              <Stethoscope className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{kpis.totalConsultations}</div>
              <p className="text-xs text-muted-foreground mt-1">Total requests &amp; sessions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Vaccinations Logged</CardTitle>
              <Syringe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{kpis.totalVaccinations}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpis.completedVaccinations} completed doses</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Emergency Referrals</CardTitle>
              <Siren className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{kpis.emergencyReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">Hospital ambulance alerts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Doctors</CardTitle>
              <Stethoscope className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{kpis.totalDoctors}</div>
              <p className="text-xs text-muted-foreground mt-1">Attending physicians</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Health Workers</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{kpis.totalHealthWorkers}</div>
              <p className="text-xs text-muted-foreground mt-1">Field community workers</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Breakdown Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Consultations Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> Consultation Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of requests across clinical lifecycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.consultationsByStatus.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.status}</span>
                    <span className="font-bold text-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.max((item.count / kpis.totalConsultations) * 100, 10)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* User Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" /> User Role Breakdown
              </CardTitle>
              <CardDescription>Platform accounts categorized by operational role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.usersByRole.map((item) => (
                <div key={item.role} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.role}</span>
                    <span className="font-bold text-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{
                        width: `${Math.max((item.count / kpis.totalUsers) * 100, 10)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}