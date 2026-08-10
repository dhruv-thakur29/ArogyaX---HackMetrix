import { mockStore } from '@/lib/db/mock/store'
import type { Patient } from '@/lib/types'

export async function getPatientById(id: string): Promise<Patient | null> {
  const p = mockStore.patients.find((pat) => pat.id === id)
  return p ? { ...p } : null
}

export async function getPatientByUserId(userId: string): Promise<Patient | null> {
  const p = mockStore.patients.find((pat) => pat.userId === userId)
  return p ? { ...p } : null
}

export async function getAllPatients(): Promise<Patient[]> {
  return [...mockStore.patients]
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'createdAt'>
): Promise<Patient> {
  const newPatient: Patient = {
    ...data,
    id: `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  mockStore.patients.unshift(newPatient)
  return { ...newPatient }
}
