import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, CheckCircle2 } from 'lucide-react'

import { getFollowUpsByDoctor, updateFollowUpStatus } from '@/lib/services/followUpService'
import { Button } from '@/components/ui/button'

export default async function DoctorFollowUpsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'doctor') redirect(dashboardPathForRole(session.role))

  // Server Action to Mark Follow-up Completed
  async function handleCompleteFollowUp(formData: FormData) {
    'use server'
    const followUpId = String(formData.get('followUpId'))
    await updateFollowUpStatus(followUpId, 'COMPLETED')
    redirect('/dashboard/doctor/follow-ups')
  }

  const followUps = await getFollowUpsByDoctor(session.id)

  return (
    <DashboardShell user={session} title="Patient Follow-up Schedule">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Scheduled Patient Follow-ups
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track patients requiring follow-up reviews, BP checks, and care plan monitoring.
          </p>
        </div>

        <div className="space-y-4">
          {followUps.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-muted-foreground">No active follow-ups scheduled.</p>
            </Card>
          ) : (
            followUps.map((f) => (
              <Card key={f.id} className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-foreground">{f.patientName}</span>
                      <Badge
                        variant={f.status === 'COMPLETED' ? 'success' : 'accent'}
                        className="font-semibold text-xs"
                      >
                        {f.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Due Date: <strong className="text-foreground">{f.dueDate}</strong>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-3 text-xs">
                  <p className="text-foreground"><strong>Reason:</strong> {f.reason}</p>
                  {f.notes && <p className="text-muted-foreground"><strong>Clinical Notes:</strong> {f.notes}</p>}
                  
                  {f.status === 'PENDING' && (
                    <form action={handleCompleteFollowUp} className="flex justify-end pt-1">
                      <input type="hidden" name="followUpId" value={f.id} />
                      <Button type="submit" size="sm" variant="outline" className="gap-1.5 font-semibold text-xs text-emerald-700 hover:bg-emerald-50">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Follow-up Completed
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
