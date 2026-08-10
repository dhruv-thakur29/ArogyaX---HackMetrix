import * as emergencyRepo from '@/lib/db/repositories/emergencyRepo.mock'
import type { EmergencyReferral } from '@/lib/types'

export const DEMO_HOSPITALS = [
  {
    id: 'hosp_1',
    name: 'District Sub-Divisional Hospital Rampur',
    distance: '4.2 km',
    emergencyContact: '+91 1800 111 222',
    bedsAvailable: 14,
  },
  {
    id: 'hosp_2',
    name: 'Community Health Centre (CHC) Chandanpur',
    distance: '7.8 km',
    emergencyContact: '+91 1800 333 444',
    bedsAvailable: 6,
  },
  {
    id: 'hosp_3',
    name: 'AIIMS Regional Referral Centre',
    distance: '22 km',
    emergencyContact: '+91 1800 999 888',
    bedsAvailable: 45,
  },
]

export async function getEmergencyReferrals(): Promise<EmergencyReferral[]> {
  return emergencyRepo.getEmergencyReferrals()
}

export async function getEmergencyReferralsByPatient(
  patientId: string
): Promise<EmergencyReferral[]> {
  return emergencyRepo.getEmergencyReferralsByPatient(patientId)
}

export async function createEmergencyReferral(
  referral: Omit<EmergencyReferral, 'id' | 'createdAt'>
): Promise<{ success: boolean; referral?: EmergencyReferral; error?: string }> {
  if (!referral.reason.trim()) {
    return { success: false, error: 'Reason for emergency referral is required.' }
  }

  const created = await emergencyRepo.createEmergencyReferral(referral)
  return { success: true, referral: created }
}
