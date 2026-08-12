import type { TriageResult, AIChatRequestPayload, AIChatResponse } from '@/lib/types'

export interface AITriageProvider {
  analyzeSymptoms(symptoms: string): Promise<TriageResult>
  chat(payload: AIChatRequestPayload): Promise<AIChatResponse>
}

export interface AIChatProvider extends AITriageProvider {
  analyzeSymptoms(symptoms: string): Promise<TriageResult>
  chat(payload: AIChatRequestPayload): Promise<AIChatResponse>
}

