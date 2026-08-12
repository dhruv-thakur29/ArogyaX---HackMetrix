import { mockStore } from '@/lib/db/mock/store'
import type { User, Consultation } from '@/lib/types'
import { requestConsultation } from './consultationService'

export interface DoctorProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  specialization: string
  experienceYears: number
  availableToday: boolean
  availableSlots: string[]
}

const MOCK_DOCTOR_PROFILES: DoctorProfile[] = [
  {
    id: 'doc_1',
    userId: 'usr_doctor_1',
    name: 'Dr. Rohan Mehta',
    email: 'doctor@arogyax.demo',
    phone: '+91 98765 12345',
    specialization: 'General Medicine & Tele-triage',
    experienceYears: 12,
    availableToday: true,
    availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM', '05:30 PM'],
  },
  {
    id: 'doc_2',
    userId: 'usr_doctor_2',
    name: 'Dr. Ananya Sen',
    email: 'ananya.sen@arogyax.demo',
    phone: '+91 98765 67890',
    specialization: 'Community Health & Pulmonology',
    experienceYears: 8,
    availableToday: true,
    availableSlots: ['10:00 AM', '01:00 PM', '03:30 PM', '06:00 PM'],
  },
]

export async function getAvailableDoctors(): Promise<DoctorProfile[]> {
  // Queries isolated service layer over store/database
  return MOCK_DOCTOR_PROFILES
}

export async function getDoctorById(id: string): Promise<DoctorProfile | null> {
  const doc = MOCK_DOCTOR_PROFILES.find((d) => d.id === id || d.userId === id)
  return doc || MOCK_DOCTOR_PROFILES[0]
}

export async function bookDoctorAppointment(
  patientId: string,
  patientName: string,
  doctorId: string,
  slotTime: string,
  reason: string
): Promise<{ success: boolean; consultation?: Consultation; error?: string }> {
  const doctor = await getDoctorById(doctorId)
  const fullReason = `[Appointment Slot: ${slotTime} with ${doctor?.name || 'Doctor'}] ${reason}`
  return requestConsultation(patientId, patientName, fullReason)
}
