'use server'

import { chatSymptoms } from '@/lib/ai/symptom-checker'
import type { AIChatResponse, Consultation } from '@/lib/types'
import { getAvailableDoctors, bookDoctorAppointment, type DoctorProfile } from '@/lib/services/doctorService'
import { requestConsultation } from '@/lib/services/consultationService'

export async function chatSymptomsAction(
  conversation: { role: 'user' | 'assistant'; content: string }[],
  patientContext?: { age?: number | null; gender?: string | null; village?: string | null }
): Promise<AIChatResponse> {
  return chatSymptoms(conversation, patientContext)
}

export async function getAvailableDoctorsAction(): Promise<DoctorProfile[]> {
  return getAvailableDoctors()
}

export async function bookDoctorAppointmentAction(
  patientId: string,
  patientName: string,
  doctorId: string,
  slotTime: string,
  reason: string
): Promise<{ success: boolean; consultation?: Consultation; error?: string }> {
  return bookDoctorAppointment(patientId, patientName, doctorId, slotTime, reason)
}

export async function requestConsultationAction(
  patientId: string,
  patientName: string,
  reason: string
): Promise<{ success: boolean; consultation?: Consultation; error?: string }> {
  return requestConsultation(patientId, patientName, reason)
}
