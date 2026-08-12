import type { AITriageProvider } from './provider'
import type { TriageLevel, TriageResult, AIChatRequestPayload, AIChatResponse } from '@/lib/types'

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

  async chat(payload: AIChatRequestPayload): Promise<AIChatResponse> {
    const conversation = payload.conversation || []
    const userMessages = conversation.filter((m: { role: string; content: string }) => m.role === 'user')
    const combinedText = userMessages.map((m: { role: string; content: string }) => m.content).join(' ').toLowerCase()
    const lastUserText = userMessages[userMessages.length - 1]?.content.toLowerCase() || ''


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

    // Mandatory Red Flag check
    if (urgentKeywords.some((kw) => combinedText.includes(kw))) {
      return {
        message:
          'I detected potential emergency red-flag symptoms. High-priority evaluation is strongly advised.',
        stage: 'assessment',
        needsMoreInformation: false,
        assessment: {
          stage: 'assessment',
          riskLevel: 'URGENT',
          summary: 'Red-flag warning symptoms identified requiring immediate medical attention.',
          possibleConditions: [
            {
              name: 'Acute Cardiorespiratory or Urgent Condition',
              reason: 'Symptoms reported (such as chest pain or breathing difficulty) fit emergency clinical evaluation criteria.',
            },
          ],
          redFlags: [
            'Acute chest tightness or discomfort',
            'Severe shortness of breath or blue lips',
            'Sudden numbness or fainting',
          ],
          selfCareGuidance: [
            'Remain seated or in a comfortable reclining posture',
            'Avoid physical exertion',
            'Do not take unprescribed medicine',
          ],
          recommendedAction:
            'Initiate emergency referral or proceed directly to the nearest hospital emergency room.',
          doctorContactRecommended: true,
          emergency: true,
          disclaimer:
            'This informational health assistant output is NOT a medical diagnosis. In an emergency, seek immediate clinical care.',
          timestamp: new Date().toISOString(),
        },
        provider: 'mock',
      }
    }

    // Determine if we need follow-up questions (turn 1 or 2 with broad input)
    const turnCount = userMessages.length

    if (turnCount === 1) {
      if (lastUserText.includes('fever') || lastUserText.includes('cough')) {
        return {
          message:
            'Thank you for sharing your symptoms. To help evaluate your condition better, how long have you had the fever or cough, and does it come and go or stay continuous?',
          stage: 'collecting_information',
          needsMoreInformation: true,
          followUpQuestion: 'Is the fever continuous or intermittent, and do you have any difficulty breathing?',
          assessment: {
            stage: 'collecting_information',
            riskLevel: 'MODERATE',
            summary: 'Gathering duration and severity details for respiratory/fever symptoms.',
            possibleConditions: [
              {
                name: 'Seasonal Viral Respiratory Infection',
                reason: 'Common cause of acute fever and cough.',
              },
            ],
            redFlags: ['High persistent fever above 102°F', 'Shortness of breath'],
            selfCareGuidance: ['Ensure ample fluid intake', 'Get adequate rest'],
            recommendedAction: 'Answer the follow-up question to refine assessment.',
            doctorContactRecommended: false,
            emergency: false,
            disclaimer: 'Informational triage guidance only.',
            timestamp: new Date().toISOString(),
          },
          provider: 'mock',
        }
      }

      if (lastUserText.includes('stomach') || lastUserText.includes('abdominal') || lastUserText.includes('nausea')) {
        return {
          message:
            'Understood. Where exactly is the stomach discomfort located (e.g. upper abdomen, lower right), and does it get worse after meals?',
          stage: 'collecting_information',
          needsMoreInformation: true,
          followUpQuestion: 'When did the stomach pain begin, and have you experienced any vomiting or fever?',
          assessment: {
            stage: 'collecting_information',
            riskLevel: 'LOW',
            summary: 'Gathering localization and association details for abdominal symptoms.',
            possibleConditions: [
              {
                name: 'Mild Gastrointestinal Discomfort / Indigestion',
                reason: 'Common presenting cause for post-meal stomach discomfort.',
              },
            ],
            redFlags: ['Severe persistent right-lower quadrant pain', 'Blood in stool or vomit'],
            selfCareGuidance: ['Eat light, bland meals', 'Stay hydrated with warm water'],
            recommendedAction: 'Provide additional details regarding pain location and duration.',
            doctorContactRecommended: false,
            emergency: false,
            disclaimer: 'Informational triage guidance only.',
            timestamp: new Date().toISOString(),
          },
          provider: 'mock',
        }
      }

      if (lastUserText.includes('headache') || lastUserText.includes('dizzy') || lastUserText.includes('head')) {
        return {
          message:
            'Thanks for letting me know. Is the headache accompanied by fever, neck stiffness, or sensitivity to bright lights?',
          stage: 'collecting_information',
          needsMoreInformation: true,
          followUpQuestion: 'How severe is the headache on a scale of 1 to 10, and how long has it lasted?',
          assessment: {
            stage: 'collecting_information',
            riskLevel: 'LOW',
            summary: 'Evaluating associated neurological warning signs for headache.',
            possibleConditions: [
              {
                name: 'Tension Headache or Dehydration',
                reason: 'Frequently manifests as mild to moderate headache or dizziness.',
              },
            ],
            redFlags: ['Sudden thunderclap headache', 'Stiff neck with high fever'],
            selfCareGuidance: ['Rest in a quiet, dark room', 'Drink adequate water'],
            recommendedAction: 'Answer the follow-up question for clinical clarification.',
            doctorContactRecommended: false,
            emergency: false,
            disclaimer: 'Informational triage guidance only.',
            timestamp: new Date().toISOString(),
          },
          provider: 'mock',
        }
      }
    }

    // Default Full Assessment after turns or detailed input
    const isModerate = ['fever', 'cough', 'vomiting', 'diarrhea', 'pain', 'rash', 'swelling'].some((kw) =>
      combinedText.includes(kw)
    )

    const riskLevel = isModerate ? 'MODERATE' : 'LOW'

    return {
      message:
        'Thank you for providing those details. Based on what you shared, I have generated a preliminary health assessment for you.',
      stage: 'assessment',
      needsMoreInformation: false,
      assessment: {
        stage: 'assessment',
        riskLevel,
        summary: `Preliminary assessment completed for reported symptoms: "${combinedText.slice(0, 100)}...".`,
        possibleConditions: isModerate
          ? [
              {
                name: 'Acute Seasonal Upper Respiratory or Mild Infection',
                reason: 'Reported fever, cough, or localized discomfort align with viral presentations.',
              },
              {
                name: 'Mild Inflammatory or Gastrointestinal Reaction',
                reason: 'Symptoms reported fit common mild inflammatory responses.',
              },
            ]
          : [
              {
                name: 'Mild Fatigue, Dehydration, or Routine Tension',
                reason: 'No acute infection or systemic illness indicators detected.',
              },
            ],
        redFlags: [
          'High persistent fever above 102°F lasting more than 3 days',
          'Shortness of breath, chest pain, or coughing up blood',
          'Inability to keep fluids down or extreme dizziness upon standing',
        ],
        selfCareGuidance: [
          'Maintain generous oral hydration with fresh water or ORS',
          'Ensure adequate restful sleep and avoid strenuous physical labor',
          'Monitor body temperature twice daily if feverish',
          'Gargle with warm saline water if experiencing throat discomfort',
        ],
        recommendedAction: isModerate
          ? 'Consulting a qualified physician within 24-48 hours is recommended for clinical review.'
          : 'Monitor your symptoms over the next 24-48 hours. Seek care if symptoms escalate.',
        doctorContactRecommended: isModerate,
        emergency: false,
        disclaimer:
          'This is an informational preliminary health assessment, NOT a medical diagnosis or prescription. Always consult a certified medical practitioner.',
        timestamp: new Date().toISOString(),
      },
      provider: 'mock',
    }
  }
}

