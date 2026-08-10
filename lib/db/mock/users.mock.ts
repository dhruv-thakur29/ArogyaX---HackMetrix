import type { UserRole } from '@/lib/types'

// DEMO-ONLY MOCK DATA.
// These are not real users, and plaintext passwords here are acceptable
// only because this file exists solely to unblock the Phase 1 prototype
// demo. Once the real database/auth provider is integrated, credentials
// will be hashed and stored by that layer — this file gets deleted.

export interface MockUserRecord {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
}

export const MOCK_USERS: MockUserRecord[] = [
  {
    id: 'usr_patient_1',
    name: 'Asha Devi',
    email: 'patient@arogyax.demo',
    password: 'demo1234',
    role: 'patient',
  },
  {
    id: 'usr_doctor_1',
    name: 'Dr. Rohan Mehta',
    email: 'doctor@arogyax.demo',
    password: 'demo1234',
    role: 'doctor',
  },
  {
    id: 'usr_health_worker_1',
    name: 'Sunita Yadav',
    email: 'healthworker@arogyax.demo',
    password: 'demo1234',
    role: 'health_worker',
  },
  {
    id: 'usr_admin_1',
    name: 'Admin User',
    email: 'admin@arogyax.demo',
    password: 'demo1234',
    role: 'admin',
  },
]