import * as consultationRepo from '@/lib/db/repositories/consultationRepo.mock'
import type { Consultation, ConsultationStatus } from '@/lib/types'

export async function getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
  return consultationRepo.getConsultationsByPatient(patientId)
}

export async function getAllConsultations(): Promise<Consultation[]> {
  return consultationRepo.getAllConsultations()
}

export async function requestConsultation(
  patientId: string,
  patientName: string,
  reason: string
): Promise<{ success: boolean; consultation?: Consultation; error?: string }> {
  if (!reason.trim()) {
    return { success: false, error: 'Please describe your health reason or symptoms.' }
  }

  const consultation = await consultationRepo.requestConsultation(
    patientId,
    patientName,
    reason.trim()
  )
  return { success: true, consultation }
}

export async function updateConsultationStatus(
  id: string,
  status: ConsultationStatus,
  doctorId?: string,
  doctorName?: string,
  notes?: string,
  carePlan?: string
): Promise<{ success: boolean; consultation?: Consultation; error?: string }> {
  const updated = await consultationRepo.updateConsultationStatus(
    id,
    status,
    doctorId,
    doctorName,
    notes,
    carePlan
  )
  if (!updated) return { success: false, error: 'Consultation not found.' }
  return { success: true, consultation: updated }
}
