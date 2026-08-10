import { MockAITriageProvider } from './mock-provider'
import { LocalLlamaProvider } from './llama-provider'
import type { AITriageProvider } from './provider'
import type { TriageResult } from '@/lib/types'

const localLlamaProvider = new LocalLlamaProvider()
const mockProvider = new MockAITriageProvider()

// Safety Red-Flag Safeguard: Key indicators that MUST trigger URGENT triage regardless of model output
const URGENT_RED_FLAGS = [
  'chest pain',
  'shortness of breath',
  'difficulty breathing',
  'bleeding',
  'unconscious',
  'seizure',
  'stroke',
  'paralysis',
  'high fever above 103',
  'severe pain',
  'fainted',
]

export async function analyzeSymptoms(symptoms: string): Promise<TriageResult> {
  const providerType = process.env.AI_SYMPTOM_CHECKER_PROVIDER || 'llama'
  let result: TriageResult

  if (providerType === 'mock') {
    result = await mockProvider.analyzeSymptoms(symptoms)
  } else {
    try {
      // Try local Llama 3.2 3B service on GPU
      result = await localLlamaProvider.analyzeSymptoms(symptoms)
    } catch (err: any) {
      console.warn(
        `[ArogyaX AI] Local Llama service unreachable or error: ${err.message}. Falling back to Mock Provider.`
      )
      result = await mockProvider.analyzeSymptoms(symptoms)
    }
  }

  // Mandatory Safety Override: If red flags detected in symptoms text, elevate triage to URGENT
  const lowerSymptoms = symptoms.toLowerCase()
  if (URGENT_RED_FLAGS.some((kw) => lowerSymptoms.includes(kw))) {
    if (result.level !== 'URGENT') {
      result.level = 'URGENT'
      result.seekImmediateCare = true
      if (!result.title.toLowerCase().includes('urgent')) {
        result.title = 'Urgent Medical Attention Recommended'
      }
      if (!result.recommendedActions.some((a) => a.toLowerCase().includes('emergency'))) {
        result.recommendedActions.unshift('Tap Emergency Referral below or seek immediate emergency care.')
      }
    }
  }

  return result
}
