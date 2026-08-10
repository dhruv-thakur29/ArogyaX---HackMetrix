import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  FileText,
  ShieldCheck,
  Siren,
  Stethoscope,
  Syringe,
  Users,
  WifiOff,
  CheckCircle2,
  Sparkles,
  Database,
  Building2,
  HeartPulse,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { FadeIn } from '@/components/landing/fade-in'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ROLES = [
  {
    icon: Activity,
    title: 'Patient',
    badge: 'Self-Care & Tele-Health',
    description: 'Check symptoms with AI triage, request doctor consultations, track prescription history, and receive scheduled care plans.',
    features: ['AI symptom triage (LOW/MODERATE/URGENT)', 'Tele-consultation queue tracking', 'Digital prescriptions & follow-up alerts'],
  },
  {
    icon: Stethoscope,
    title: 'Doctor',
    badge: 'Clinical Tele-Suite',
    description: 'Accept consultation requests from queue, review patient vitals & vaccine records, issue structured prescriptions & care plans.',
    features: ['Clinical queue management', 'Vitals & immunization history review', 'Structured prescription & follow-up engine'],
  },
  {
    icon: Users,
    title: 'Health Worker',
    badge: 'Field & Offline Ops',
    description: 'Register community patients during village visits, record physiological vitals & vaccinations, and queue actions offline.',
    features: ['Field patient registration', 'Vitals range validation', 'Offline IndexedDB queue & auto-sync'],
  },
  {
    icon: ShieldCheck,
    title: 'Admin',
    badge: 'System Governance',
    description: 'Real-time platform oversight across village populations, doctor activity, immunization coverage, and emergency dispatches.',
    features: ['Live KPI dashboard', 'User account oversight', 'Emergency referral monitoring'],
  },
]

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Patient Requests Consultation or Checks Symptoms',
    description: 'Patient enters symptoms into AI Triage or submits a tele-consultation request with chief complaints.',
    role: 'Patient',
  },
  {
    step: '02',
    title: 'Doctor Accepts Request & Evaluates Clinical Profile',
    description: 'Doctor picks up patient from queue, reviews latest vitals & vaccine logs, and conducts tele-consultation.',
    role: 'Doctor',
  },
  {
    step: '03',
    title: 'Prescription & Care Plan Instantly Synchronized',
    description: 'Doctor issues prescription, notes, and follow-up timeline, immediately reflected in patient dashboard.',
    role: 'Connected System',
  },
  {
    step: '04',
    title: 'Health Worker Field Care & Offline Synchronization',
    description: 'Community health worker records field vitals or vaccinations offline. Data syncs automatically upon reconnecting.',
    role: 'Health Worker',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="hero-glow relative overflow-hidden border-b border-border/50">
        <div className="container grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <FadeIn>
              <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 font-semibold px-3 py-1">
                ArogyaX Healthcare Platform
              </Badge>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h1 className="font-display text-4xl font-bold leading-[1.15] text-foreground md:text-5xl lg:text-6xl">
                Connected healthcare for communities, even when connectivity is limited.
              </h1>
            </FadeIn>
            <FadeIn delay={0.16}>
              <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg leading-relaxed">
                ArogyaX bridges the gap between rural health posts, tele-health doctors, patients, and health administrators in one unified, offline-first ecosystem.
              </p>
            </FadeIn>
            <FadeIn delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'group font-semibold text-base px-6')}>
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'font-semibold text-base px-6')}>
                  Sign In to Demo
                </Link>
              </div>
            </FadeIn>
            <FadeIn delay={0.32}>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 border border-border">
                  <WifiOff className="h-4 w-4 text-primary" /> Offline-First IndexedDB
                </span>
                <span className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 border border-border">
                  <Sparkles className="h-4 w-4 text-purple-600" /> AI Symptom Triage
                </span>
                <span className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 border border-border">
                  <Siren className="h-4 w-4 text-destructive" /> Emergency Referral
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Interactive Live Card Preview */}
          <FadeIn delay={0.2}>
            <Card className="mx-auto w-full max-w-md shadow-xl border-border/80 bg-card">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base font-bold">Patient Card: Asha Devi</CardTitle>
                      <CardDescription className="text-xs">Village: Rampur &middot; Age: 34</CardDescription>
                    </div>
                  </div>
                  <Badge variant="success" className="font-bold">IN_PROGRESS</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="rounded-lg bg-primary/5 p-3 border border-primary/20 space-y-1">
                  <p className="font-semibold text-primary">Chief Complaint:</p>
                  <p className="text-foreground">Persistent mild fever and seasonal cough for 3 days.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded border border-border p-2 bg-background">
                    <span className="text-muted-foreground block">Attending Doctor:</span>
                    <strong className="text-foreground">Dr. Rohan Mehta</strong>
                  </div>
                  <div className="rounded border border-border p-2 bg-background">
                    <span className="text-muted-foreground block">Vitals Logged:</span>
                    <strong className="text-emerald-600">37.1°C &middot; 120/80 mmHg</strong>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 space-y-1">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Prescribed Medicine:
                  </p>
                  <p className="text-muted-foreground">Paracetamol 500mg &mdash; Thrice daily for 5 days.</p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* Four Roles Section */}
      <section id="roles" className="border-t border-border bg-muted/20 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-2">Multi-Role Architecture</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              One platform, four role-based portals
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              ArogyaX connects every role in the healthcare value chain through shared repositories and unified data state.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => (
              <Card key={role.title} className="hover:shadow-md transition-all border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <role.icon className="h-7 w-7 text-primary" />
                    <Badge variant="secondary" className="text-[10px]">{role.badge}</Badge>
                  </div>
                  <CardTitle className="text-lg font-bold">{role.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 text-xs text-muted-foreground border-t border-border/60 pt-3">
                    {role.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Connected Workflow Section */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-2">End-to-End Workflow</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              How ArogyaX connects care seamlessly
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A single patient record moves seamlessly from initial symptom triage to clinical prescription and field health monitoring.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.step} className="relative rounded-xl border border-border p-6 bg-card space-y-3">
                <span className="font-display text-4xl font-extrabold text-primary/20 block">
                  {step.step}
                </span>
                <Badge variant="outline" className="text-[11px] font-semibold">{step.role}</Badge>
                <h3 className="font-display text-base font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-muted/40">
        <div className="container flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm text-foreground">ArogyaX</span>
            <span>&mdash; Connected Community Healthcare Platform</span>
          </div>
          <p>Hackathon Prototype. Fictional demo data for testing and demonstration.</p>
        </div>
      </footer>
    </div>
  )
}