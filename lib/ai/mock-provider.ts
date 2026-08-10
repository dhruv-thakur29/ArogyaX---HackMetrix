import type { AITriageProvider } from './provider'
import type { TriageLevel, TriageResult } from '@/lib/types'

export class MockAITriageProvider implements AITriageProvider {
  async analyzeSymptoms(symptoms: string): Promise<TriageResult> {
    const text = symptoms.toLowerCase()

    // Key indicators for URGENT triage
    const urgentKeywords = [
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

    // Key indicators for MODERATE triage
    const moderateKeywords = [
      'fever',
      'vomiting',
      'diarrhea',
      'persistent cough',
      'dizziness',
      'abdominal pain',
      'rash',
      'joint swelling',
      'earache',
      'blurred vision',
    ]

    let level: TriageLevel = 'LOW'
    let title = 'Mild / Low Priority'
    let summary = 'Symptoms indicate a mild self-limiting condition or general fatigue.'
    let explanation: string[] = [
      'Reported symptoms suggest mild discomfort without acute distress.',
      'No critical red-flag indicators (e.g. chest pain, breathing difficulty) were detected.',
    ]
    let recommendedActions: string[] = [
      'Ensure adequate hydration and rest.',
      'Monitor symptoms over the next 24-48 hours.',
      'Schedule a routine consultation with a doctor if symptoms persist or worsen.',
    ]
    let seekImmediateCare = false

    if (urgentKeywords.some((kw) => text.includes(kw))) {
      level = 'URGENT'
      title = 'Urgent Medical Attention Recommended'
      summary = 'Warning symptoms detected that require immediate evaluation at a health facility.'
      explanation = [
        'Red-flag symptoms (such as acute chest pain, severe breathlessness, or neurological signs) were identified.',
        'Immediate clinical triage by an qualified medical professional or emergency room is required.',
      ]
      recommendedActions = [
        'Tap the Emergency Referral button below to alert a nearby clinic/hospital.',
        'Do not wait. Transport the patient to the nearest sub-divisional hospital or CHC.',
        'Keep patient calm, seated or reclining comfortably.',
      ]
      seekImmediateCare = true
    } else if (moderateKeywords.some((kw) => text.includes(kw))) {
      level = 'MODERATE'
      title = 'Moderate Priority — Doctor Consultation Recommended'
      summary = 'Symptoms warrant timely clinical review by a doctor within 24-48 hours.'
      explanation = [
        'Symptoms such as fever, persistent cough, or localized pain require medical evaluation.',
        'While not immediately life-threatening, prompt care prevents potential complications.',
      ]
      recommendedActions = [
        'Request a tele-consultation or visit your local health center.',
        'Drink plenty of fluids and maintain a light diet.',
        'Track body temperature or vitals if a health worker is nearby.',
      ]
    }

    return {
      level,
      title,
      summary,
      explanation,
      recommendedActions,
      seekImmediateCare,
      disclaimer:
        'This tool provides informational triage guidance only and is NOT a medical diagnosis or treatment plan. Always consult a certified healthcare professional.',
      timestamp: new Date().toISOString(),
    }
  }
}
