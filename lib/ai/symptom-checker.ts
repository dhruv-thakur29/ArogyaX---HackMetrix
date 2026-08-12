import { MockAITriageProvider } from './mock-provider'
import { LocalLlamaProvider } from './llama-provider'
import type { TriageResult, AIChatRequestPayload, AIChatResponse } from '@/lib/types'

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
  'allergic reaction',
  'anaphylaxis',
  'coughing blood',
  'suicidal',
  'self-harm',
  'self harm',
  'numbness on one side',
  'sudden vision loss',
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

export async function chatSymptoms(
  conversation: { role: 'user' | 'assistant'; content: string }[],
  patientContext?: { age?: number | null; gender?: string | null; village?: string | null }
): Promise<AIChatResponse> {
  const providerType = process.env.AI_SYMPTOM_CHECKER_PROVIDER || 'llama'
  const payload: AIChatRequestPayload = { conversation, patientContext }

  // Check all user text in conversation for emergency red flags
  const combinedUserText = conversation
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ')

  const hasRedFlag = URGENT_RED_FLAGS.some((kw) => combinedUserText.includes(kw))

  let chatResponse: AIChatResponse

  if (providerType === 'mock') {
    chatResponse = await mockProvider.chat(payload)
  } else {
    try {
      chatResponse = await localLlamaProvider.chat(payload)
    } catch (err: any) {
      console.warn(
        `[ArogyaX AI] Local Llama chat service error or unreachable (${err.message}). Using safe Mock AI chat provider.`
      )
      chatResponse = await mockProvider.chat(payload)
    }
  }

  // Deterministic Safety Override: LLM can NEVER downgrade a red flag emergency
  if (hasRedFlag) {
    chatResponse.stage = 'assessment'
    chatResponse.needsMoreInformation = false
    chatResponse.assessment = {
      ...chatResponse.assessment,
      stage: 'assessment',
      riskLevel: 'URGENT',
      emergency: true,
      doctorContactRecommended: true,
      recommendedAction:
        'Red-flag warning symptoms identified! Initiate emergency referral or visit nearest hospital emergency room immediately.',
    }
    if (!chatResponse.message.toLowerCase().includes('emergency') && !chatResponse.message.toLowerCase().includes('urgent')) {
      chatResponse.message =
        '⚠️ Critical warning symptoms identified. Immediate clinical evaluation is required. Please seek emergency medical care.'
    }
  }

  return chatResponse
}

