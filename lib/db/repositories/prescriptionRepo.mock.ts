import { mockStore } from '@/lib/db/mock/store'
import type { Prescription } from '@/lib/types'

export async function getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
  return mockStore.prescriptions
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getPrescriptionByConsultation(
  consultationId: string
): Promise<Prescription | null> {
  const p = mockStore.prescriptions.find((item) => item.consultationId === consultationId)
  return p ? { ...p } : null
}

export async function getAllPrescriptions(): Promise<Prescription[]> {
  return [...mockStore.prescriptions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function createPrescription(
  data: Omit<Prescription, 'id' | 'createdAt'>
): Promise<Prescription> {
  const newRx: Prescription = {
    ...data,
    id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  mockStore.prescriptions.unshift(newRx)
  return { ...newRx }
}
