'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Info,
  ShieldAlert,
  Siren,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { analyzeSymptoms } from '@/lib/ai/symptom-checker'
import type { TriageResult } from '@/lib/types'

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TriageResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms.trim()) {
      setError('Please enter your symptoms before checking.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await analyzeSymptoms(symptoms)
      setResult(res)
    } catch (err: any) {
      setError('Failed to analyze symptoms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sampleSymptoms = [
    'Mild fever and dry cough for 3 days',
    'Severe chest pain and shortness of breath',
    'Dizziness and persistent headache in afternoons',
    'Stomach pain and nausea after meals',
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            AI Triage Service
          </Badge>
          <span className="text-xs text-muted-foreground">Deterministic Mock AI</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl mt-1">
          Symptom Checker & Triage
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your current health symptoms to receive instant informational triage guidance and recommended next actions.
        </p>
      </div>

      {/* Mandatory Safety Disclaimer Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-sm text-amber-900 dark:text-amber-100">
              Important Medical Disclaimer
            </p>
            <p className="mt-0.5">
              This tool provides informational triage guidance and is <strong>NOT a medical diagnosis</strong> or prescription. In case of severe distress, immediate emergency medical attention is strongly advised.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Input Form Column */}
        <div className="md:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Describe Your Symptoms
              </CardTitle>
              <CardDescription>
                Be specific about symptoms, duration, and severity for accurate triage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheck} className="space-y-4">
                <div>
                  <label htmlFor="symptoms" className="block text-xs font-semibold text-foreground mb-1.5">
                    What symptoms are you experiencing?
                  </label>
                  <textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., Low grade fever, persistent dry cough for 3 days, mild sore throat..."
                    rows={4}
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {error && <p className="text-xs font-medium text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full gap-2 font-semibold">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Analyzing Symptoms...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze & Triage Symptoms
                    </>
                  )}
                </Button>
              </form>

              {/* Sample prompts */}
              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" /> Try example symptoms:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sampleSymptoms.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setSymptoms(sample)}
                      className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                    >
                      &quot;{sample}&quot;
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Triage Results Column */}
        <div className="md:col-span-5 space-y-4">
          {result ? (
            <Card
              className={
                result.level === 'URGENT'
                  ? 'border-destructive bg-destructive/5'
                  : result.level === 'MODERATE'
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-emerald-500/50 bg-emerald-500/5'
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Triage Result
                  </span>
                  <Badge
                    variant={
                      result.level === 'URGENT'
                        ? 'destructive'
                        : result.level === 'MODERATE'
                        ? 'warning'
                        : 'success'
                    }
                    className="text-xs font-bold px-2.5 py-0.5"
                  >
                    {result.level} PRIORITY
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-foreground mt-2">
                  {result.title}
                </CardTitle>
                <CardDescription className="text-xs">{result.summary}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* Clinical Explanation */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">Clinical Summary:</p>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                    {result.explanation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Actions */}
                <div className="space-y-1.5 rounded-lg bg-background p-3 border border-border">
                  <p className="font-semibold text-foreground">Recommended Next Steps:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {result.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 space-y-2">
                  {result.level === 'URGENT' ? (
                    <Link
                      href="/dashboard/patient/emergency"
                      className={buttonVariants({ variant: 'destructive', className: 'w-full gap-2 font-bold' })}
                    >
                      <Siren className="h-4 w-4 animate-bounce" />
                      Initiate Emergency Referral
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/patient/consultations"
                      className={buttonVariants({ className: 'w-full gap-2' })}
                    >
                      <Stethoscope className="h-4 w-4" />
                      Request Doctor Consultation
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-dashed">
              <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                No Triage Result Yet
              </CardTitle>
              <CardDescription className="text-xs max-w-xs mt-1">
                Enter your symptoms on the left and click &quot;Analyze &amp; Triage Symptoms&quot; to see your clinical assessment.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
