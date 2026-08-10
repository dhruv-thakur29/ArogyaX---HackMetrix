import { mockStore } from '@/lib/db/mock/store'
import type { VitalsRecord } from '@/lib/types'

export async function getVitalsByPatient(patientId: string): Promise<VitalsRecord[]> {
  return mockStore.vitals
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
}

export async function getAllVitals(): Promise<VitalsRecord[]> {
  return [...mockStore.vitals].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )
}

export async function recordVitals(
  vitals: Omit<VitalsRecord, 'id' | 'recordedAt'>
): Promise<VitalsRecord> {
  const newVitals: VitalsRecord = {
    ...vitals,
    id: `vit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recordedAt: new Date().toISOString(),
  }
  mockStore.vitals.unshift(newVitals)
  return { ...newVitals }
}
