import { mockStore } from '@/lib/db/mock/store'
import type { Consultation, ConsultationStatus } from '@/lib/types'

export async function getConsultationById(id: string): Promise<Consultation | null> {
  const c = mockStore.consultations.find((item) => item.id === id)
  return c ? { ...c } : null
}

export async function getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
  return mockStore.consultations
    .filter((c) => c.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getAllConsultations(): Promise<Consultation[]> {
  return [...mockStore.consultations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function requestConsultation(
  patientId: string,
  patientName: string,
  reason: string
): Promise<Consultation> {
  const newConsultation: Consultation = {
    id: `cns_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    patientId,
    patientName,
    status: 'REQUESTED',
    reason,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockStore.consultations.unshift(newConsultation)
  return { ...newConsultation }
}

export async function updateConsultationStatus(
  id: string,
  status: ConsultationStatus,
  doctorId?: string,
  doctorName?: string,
  notes?: string,
  carePlan?: string
): Promise<Consultation | null> {
  const c = mockStore.consultations.find((item) => item.id === id)
  if (!c) return null

  c.status = status
  c.updatedAt = new Date().toISOString()
  if (doctorId) c.doctorId = doctorId
  if (doctorName) c.doctorName = doctorName
  if (notes !== undefined) c.notes = notes
  if (carePlan !== undefined) c.carePlan = carePlan

  return { ...c }
}
