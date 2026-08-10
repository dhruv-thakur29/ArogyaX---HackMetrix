import * as vitalsRepo from '@/lib/db/repositories/vitalsRepo.mock'
import type { VitalsRecord } from '@/lib/types'

export async function getVitalsByPatient(patientId: string): Promise<VitalsRecord[]> {
  return vitalsRepo.getVitalsByPatient(patientId)
}

export async function getAllVitals(): Promise<VitalsRecord[]> {
  return vitalsRepo.getAllVitals()
}

export async function recordVitals(
  vitals: Omit<VitalsRecord, 'id' | 'recordedAt'>
): Promise<{ success: boolean; record?: VitalsRecord; error?: string }> {
  if (vitals.temperatureCelsius < 30 || vitals.temperatureCelsius > 45) {
    return { success: false, error: 'Temperature must be between 30°C and 45°C.' }
  }
  if (vitals.oxygenSatPercent < 50 || vitals.oxygenSatPercent > 100) {
    return { success: false, error: 'Oxygen saturation must be between 50% and 100%.' }
  }

  const record = await vitalsRepo.recordVitals(vitals)
  return { success: true, record }
}
