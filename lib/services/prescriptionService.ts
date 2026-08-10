import * as prescriptionRepo from '@/lib/db/repositories/prescriptionRepo.mock'
import type { Prescription, PrescriptionItem } from '@/lib/types'

export async function getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
  return prescriptionRepo.getPrescriptionsByPatient(patientId)
}

export async function getAllPrescriptions(): Promise<Prescription[]> {
  return prescriptionRepo.getAllPrescriptions()
}

export async function getPrescriptionByConsultation(
  consultationId: string
): Promise<Prescription | null> {
  return prescriptionRepo.getPrescriptionByConsultation(consultationId)
}

export async function createPrescription(data: {
  consultationId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  medicines: Omit<PrescriptionItem, 'id'>[]
}): Promise<{ success: boolean; prescription?: Prescription; error?: string }> {
  if (!data.medicines || data.medicines.length === 0) {
    return { success: false, error: 'At least one medicine is required in the prescription.' }
  }

  const items: PrescriptionItem[] = data.medicines.map((m, idx) => ({
    ...m,
    id: `med_${Date.now()}_${idx}`,
  }))

  const prescription = await prescriptionRepo.createPrescription({
    consultationId: data.consultationId,
    patientId: data.patientId,
    patientName: data.patientName,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    medicines: items,
  })

  return { success: true, prescription }
}
