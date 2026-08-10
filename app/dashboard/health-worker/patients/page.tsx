import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { dashboardPathForRole } from '@/lib/auth/permissions'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, MapPin, Phone, Calendar } from 'lucide-react'

import { getAllPatients, registerPatient } from '@/lib/services/patientService'

export default async function HealthWorkerPatientsPage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'health_worker') redirect(dashboardPathForRole(session.role))
  const workerName = session.name

  // Server Action to Register Patient
  async function handleRegisterPatient(formData: FormData) {
    'use server'
    const name = String(formData.get('name') ?? '')
    const age = Number(formData.get('age') ?? 30)
    const gender = String(formData.get('gender') ?? 'Female') as 'Male' | 'Female' | 'Other'
    const village = String(formData.get('village') ?? 'Rampur')
    const bloodGroup = String(formData.get('bloodGroup') ?? 'O+')
    const phone = String(formData.get('phone') ?? '')

    if (name.trim()) {
      await registerPatient({
        name: name.trim(),
        age,
        gender,
        village: village.trim(),
        bloodGroup: bloodGroup.trim(),
        phone: phone.trim() || '+91 98765 00000',
        registeredBy: `${workerName} (Health Worker)`,
      })
      redirect('/dashboard/health-worker/patients')
    }
  }

  const patients = await getAllPatients()

  return (
    <DashboardShell user={session} title="Patient Registration &amp; Directory">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Patient Directory &amp; Field Registration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Register new community members in field visits and access comprehensive patient profiles.
          </p>
        </div>

        {/* Registration Form Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Register New Synthetic Patient
            </CardTitle>
            <CardDescription>Enter patient demographics for field registration.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleRegisterPatient} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <label htmlFor="name" className="block font-semibold text-foreground mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Meena Devi"
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block font-semibold text-foreground mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    required
                    defaultValue={32}
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block font-semibold text-foreground mb-1">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="village" className="block font-semibold text-foreground mb-1">
                    Village / Block *
                  </label>
                  <input
                    type="text"
                    id="village"
                    name="village"
                    required
                    placeholder="e.g. Rampur"
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="bloodGroup" className="block font-semibold text-foreground mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    id="bloodGroup"
                    name="bloodGroup"
                    defaultValue="O+"
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block font-semibold text-foreground mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    placeholder="+91 98765 00000"
                    className="w-full rounded-lg border border-input bg-background p-2.5 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="gap-2 font-semibold">
                  <UserPlus className="h-4 w-4" /> Save &amp; Register Patient
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Patient Directory List */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Registered Patients Directory ({patients.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {patients.map((pat) => (
              <Card key={pat.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground">{pat.name}</CardTitle>
                    <Badge variant="outline" className="text-xs font-mono">{pat.id}</Badge>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-2">
                    <span>Age: {pat.age} &middot; {pat.gender}</span>
                    <span>&middot; Blood Group: <strong>{pat.bloodGroup}</strong></span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Village: <strong className="text-foreground">{pat.village}</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> Phone: <span className="font-mono text-foreground">{pat.phone}</span>
                  </p>
                  <p className="text-[11px] opacity-75 pt-1 border-t border-border">
                    Registered By: {pat.registeredBy}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
