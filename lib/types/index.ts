export type UserRole = 'patient' | 'doctor' | 'health_worker' | 'admin'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface User extends SessionUser {
  phone?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export interface Patient {
  id: string
  userId?: string
  name: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  village: string
  bloodGroup: string
  phone: string
  registeredBy: string
  createdAt: string
}

export type TriageLevel = 'LOW' | 'MODERATE' | 'URGENT'

export interface TriageResult {
  level: TriageLevel
  title: string
  summary: string
  explanation: string[]
  recommendedActions: string[]
  seekImmediateCare: boolean
  disclaimer: string
  timestamp: string
}

export type ConsultationStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Consultation {
  id: string
  patientId: string
  patientName: string
  doctorId?: string
  doctorName?: string
  status: ConsultationStatus
  reason: string
  notes?: string
  carePlan?: string
  createdAt: string
  updatedAt: string
}

export interface PrescriptionItem {
  id: string
  name: string
  dosage: string
  frequency: string
  durationDays: number
  instructions?: string
  substitutionRequired?: boolean
  substitutionApproved?: boolean
  alternativeName?: string
}

export interface Prescription {
  id: string
  consultationId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  medicines: PrescriptionItem[]
  createdAt: string
}

export type VaccineStatus = 'COMPLETED' | 'UPCOMING' | 'OVERDUE'

export interface Vaccination {
  id: string
  patientId: string
  patientName: string
  vaccineName: string
  status: VaccineStatus
  dueDate?: string
  administeredDate?: string
  administeredBy?: string
}

export interface VitalsRecord {
  id: string
  patientId: string
  patientName: string
  temperatureCelsius: number
  bloodPressureSys: number
  bloodPressureDia: number
  heartRateBpm: number
  oxygenSatPercent: number
  weightKg?: number
  heightCm?: number
  recordedBy: string
  recordedAt: string
}

export interface EmergencyReferral {
  id: string
  patientId: string
  patientName: string
  reportedBy: string
  reporterRole: UserRole
  reason: string
  severity: 'HIGH' | 'CRITICAL'
  hospitalName: string
  status: 'PENDING' | 'DISPATCHED' | 'ADMITTED' | 'RESOLVED'
  createdAt: string
}

export interface OfflineAction {
  id: string
  type: 'REGISTER_PATIENT' | 'RECORD_VITALS' | 'RECORD_VACCINE' | 'EMERGENCY_REFERRAL'
  payload: any
  timestamp: string
  synced: boolean
}

export interface FollowUp {
  id: string
  consultationId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  dueDate: string
  reason: string
  notes?: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
}