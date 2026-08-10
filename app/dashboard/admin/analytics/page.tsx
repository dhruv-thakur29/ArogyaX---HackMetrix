import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Activity, Syringe, Stethoscope, Users } from 'lucide-react'

import { getAnalyticsData, getAdminKPIs } from '@/lib/services/analyticsService'

export default async function AdminAnalyticsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect(dashboardPathForRole(session.role))

  const analytics = await getAnalyticsData()
  const kpis = await getAdminKPIs()

  return (
    <DashboardShell user={session} title="Operational Analytics &amp; Metrics">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Platform Operational Trends
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Data insights, tele-health volume analytics, and community immunization activity.
          </p>
        </div>

        {/* Weekly Consultation Trend Visualizer */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Daily Tele-Consultation Trend
                </CardTitle>
                <CardDescription>Consultations requested over the past 7 days.</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono">7-Day Volume</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40 pt-6 px-4 border-b border-border">
              {analytics.consultationTrends.map((t) => {
                const maxCount = 15
                const heightPercent = Math.max((t.count / maxCount) * 100, 15)
                return (
                  <div key={t.day} className="flex flex-col items-center flex-1 space-y-2">
                    <span className="text-[11px] font-bold text-primary">{t.count}</span>
                    <div
                      className="w-full max-w-[36px] bg-primary/80 hover:bg-primary rounded-t-md transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">{t.day}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Vaccination Activity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Syringe className="h-5 w-5 text-purple-600" /> Immunization Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.vaccinationsByStatus.map((vac) => (
                <div key={vac.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{vac.status} Doses</span>
                    <span className="font-bold text-foreground">{vac.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${Math.max((vac.count / (kpis.totalVaccinations || 1)) * 100, 10)}%` }}
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
                <Users className="h-5 w-5 text-emerald-600" /> User Population Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.usersByRole.map((usr) => (
                <div key={usr.role} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{usr.role} Accounts</span>
                    <span className="font-bold text-foreground">{usr.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.max((usr.count / (kpis.totalUsers || 1)) * 100, 10)}%` }}
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
