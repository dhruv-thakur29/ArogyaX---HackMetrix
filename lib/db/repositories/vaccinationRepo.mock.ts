import { mockStore } from '@/lib/db/mock/store'
import type { Vaccination, VaccineStatus } from '@/lib/types'

export async function getVaccinationsByPatient(patientId: string): Promise<Vaccination[]> {
  return mockStore.vaccinations.filter((v) => v.patientId === patientId)
}

export async function getAllVaccinations(): Promise<Vaccination[]> {
  return [...mockStore.vaccinations]
}

export async function recordVaccination(
  patientId: string,
  patientName: string,
  vaccineName: string,
  status: VaccineStatus,
  dueDate?: string,
  administeredDate?: string,
  administeredBy?: string
): Promise<Vaccination> {
  const existing = mockStore.vaccinations.find(
    (v) => v.patientId === patientId && v.vaccineName.toLowerCase() === vaccineName.toLowerCase()
  )

  if (existing) {
    existing.status = status
    if (dueDate) existing.dueDate = dueDate
    if (administeredDate) existing.administeredDate = administeredDate
    if (administeredBy) existing.administeredBy = administeredBy
    return { ...existing }
  }

  const newVac: Vaccination = {
    id: `vac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    patientId,
    patientName,
    vaccineName,
    status,
    dueDate,
    administeredDate,
    administeredBy,
  }
  mockStore.vaccinations.unshift(newVac)
  return { ...newVac }
}
