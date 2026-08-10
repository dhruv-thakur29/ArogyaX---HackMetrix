import * as patientRepo from '@/lib/db/repositories/patientRepo.mock'
import type { Patient } from '@/lib/types'

export async function getPatientById(id: string): Promise<Patient | null> {
  return patientRepo.getPatientById(id)
}

export async function getPatientByUserId(userId: string): Promise<Patient | null> {
  return patientRepo.getPatientByUserId(userId)
}

export async function getAllPatients(): Promise<Patient[]> {
  return patientRepo.getAllPatients()
}

export async function registerPatient(
  data: Omit<Patient, 'id' | 'createdAt'>
): Promise<{ success: boolean; patient?: Patient; error?: string }> {
  if (!data.name.trim()) {
    return { success: false, error: 'Patient name is required.' }
  }
  if (!data.village.trim()) {
    return { success: false, error: 'Village name is required.' }
  }

  const patient = await patientRepo.createPatient(data)
  return { success: true, patient }
}
