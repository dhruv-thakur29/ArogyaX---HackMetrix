import type { TriageResult } from '@/lib/types'

export interface AITriageProvider {
  analyzeSymptoms(symptoms: string): Promise<TriageResult>
}
