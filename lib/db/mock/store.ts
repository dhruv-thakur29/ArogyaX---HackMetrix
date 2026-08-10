import {
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_CONSULTATIONS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_VACCINATIONS,
  INITIAL_VITALS,
  INITIAL_EMERGENCY_REFERRALS,
  INITIAL_FOLLOW_UPS,
} from './initialData'
import type {
  User,
  Patient,
  Consultation,
  Prescription,
  Vaccination,
  VitalsRecord,
  EmergencyReferral,
  FollowUp,
} from '@/lib/types'

// Singleton mock store in Node process memory during dev server runtime
class MockStore {
  users: User[] = [...INITIAL_USERS]
  credentials: Record<string, string> = {
    usr_patient_1: 'demo1234',
    usr_doctor_1: 'demo1234',
    usr_health_worker_1: 'demo1234',
    usr_admin_1: 'demo1234',
  }
  patients: Patient[] = [...INITIAL_PATIENTS]
  consultations: Consultation[] = [...INITIAL_CONSULTATIONS]
  prescriptions: Prescription[] = [...INITIAL_PRESCRIPTIONS]
  vaccinations: Vaccination[] = [...INITIAL_VACCINATIONS]
  vitals: VitalsRecord[] = [...INITIAL_VITALS]
  emergencyReferrals: EmergencyReferral[] = [...INITIAL_EMERGENCY_REFERRALS]
  followUps: FollowUp[] = [...INITIAL_FOLLOW_UPS]
}

// Preserve store across Next.js fast-refresh during dev
const globalForStore = globalThis as unknown as { mockStore?: MockStore }

export const mockStore = globalForStore.mockStore ?? new MockStore()

if (process.env.NODE_ENV !== 'production') {
  globalForStore.mockStore = mockStore
}
