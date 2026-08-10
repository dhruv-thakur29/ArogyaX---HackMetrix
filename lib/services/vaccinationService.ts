import * as vaccinationRepo from '@/lib/db/repositories/vaccinationRepo.mock'
import type { Vaccination, VaccineStatus } from '@/lib/types'

export async function getVaccinationsByPatient(patientId: string): Promise<Vaccination[]> {
  return vaccinationRepo.getVaccinationsByPatient(patientId)
}

export async function getAllVaccinations(): Promise<Vaccination[]> {
  return vaccinationRepo.getAllVaccinations()
}

export async function recordVaccination(
  patientId: string,
  patientName: string,
  vaccineName: string,
  status: VaccineStatus,
  dueDate?: string,
  administeredDate?: string,
  administeredBy?: string
): Promise<{ success: boolean; vaccination?: Vaccination; error?: string }> {
  if (!vaccineName.trim()) {
    return { success: false, error: 'Vaccine name is required.' }
  }

  const vac = await vaccinationRepo.recordVaccination(
    patientId,
    patientName,
    vaccineName,
    status,
    dueDate,
    administeredDate,
    administeredBy
  )

  return { success: true, vaccination: vac }
}
