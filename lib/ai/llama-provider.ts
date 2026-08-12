import type { AITriageProvider } from './provider'
import type { TriageResult, AIChatRequestPayload, AIChatResponse } from '@/lib/types'

export class LocalLlamaProvider implements AITriageProvider {
  private serviceUrl: string

  constructor(serviceUrl?: string) {
    this.serviceUrl =
      serviceUrl || process.env.LOCAL_AI_SERVICE_URL || 'http://127.0.0.1:8000'
  }

  async analyzeSymptoms(symptoms: string): Promise<TriageResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout for local GPU inference

    try {
      const response = await fetch(`${this.serviceUrl}/api/v1/triage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Local Llama AI service returned status ${response.status}: ${errorText}`
        )
      }

      const data: TriageResult = await response.json()
      return data
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new Error('Local Llama inference timed out after 20 seconds.')
      }
      throw err
    }
  }

  async chat(payload: AIChatRequestPayload): Promise<AIChatResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(`${this.serviceUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: payload.conversation,
          patient_context: payload.patientContext
            ? {
                age: payload.patientContext.age,
                sex: payload.patientContext.gender,
                known_conditions: payload.patientContext.knownConditions || [],
                medications: payload.patientContext.medications || [],
              }
            : null,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Local Llama AI service chat returned status ${response.status}: ${errorText}`
        )
      }

      const raw: any = await response.json()

      return {
        message: raw.message || '',
        stage: raw.stage || 'collecting_information',
        needsMoreInformation: Boolean(raw.needs_more_information),
        followUpQuestion: raw.follow_up_question || undefined,
        assessment: {
          stage: raw.stage || 'collecting_information',
          riskLevel: raw.risk_level || 'LOW',
          summary: raw.message || '',
          possibleConditions: (raw.possible_conditions || []).map((c: any) => ({
            name: c.name || '',
            reason: c.reason || '',
          })),
          redFlags: raw.red_flags || [],
          selfCareGuidance: raw.self_care_guidance || [],
          recommendedAction: raw.recommended_action || '',
          doctorContactRecommended: Boolean(raw.doctor_contact_recommended),
          emergency: Boolean(raw.emergency),
          disclaimer:
            raw.disclaimer ||
            'This local Llama AI model provides informational guidance only and is NOT a medical diagnosis.',
          timestamp: raw.timestamp || new Date().toISOString(),
        },
        provider: 'llama',
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new Error('Local Llama chat inference timed out after 20 seconds.')
      }
      throw err
    }
  }
}

