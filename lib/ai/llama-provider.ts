import type { AITriageProvider } from './provider'
import type { TriageResult } from '@/lib/types'

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
}
