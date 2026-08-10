import { mockStore } from '@/lib/db/mock/store'
import type { EmergencyReferral } from '@/lib/types'

export async function getEmergencyReferrals(): Promise<EmergencyReferral[]> {
  return [...mockStore.emergencyReferrals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getEmergencyReferralsByPatient(
  patientId: string
): Promise<EmergencyReferral[]> {
  return mockStore.emergencyReferrals
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function createEmergencyReferral(
  referral: Omit<EmergencyReferral, 'id' | 'createdAt'>
): Promise<EmergencyReferral> {
  const newReferral: EmergencyReferral = {
    ...referral,
    id: `emg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  mockStore.emergencyReferrals.unshift(newReferral)
  return { ...newReferral }
}

export async function updateEmergencyStatus(
  id: string,
  status: EmergencyReferral['status']
): Promise<EmergencyReferral | null> {
  const item = mockStore.emergencyReferrals.find((r) => r.id === id)
  if (!item) return null
  item.status = status
  return { ...item }
}
