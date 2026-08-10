import * as followUpRepo from '@/lib/db/repositories/followUpRepo.mock'
import type { FollowUp } from '@/lib/types'

export async function getFollowUpsByDoctor(doctorId: string): Promise<FollowUp[]> {
  return followUpRepo.getFollowUpsByDoctor(doctorId)
}

export async function getFollowUpsByPatient(patientId: string): Promise<FollowUp[]> {
  return followUpRepo.getFollowUpsByPatient(patientId)
}

export async function getAllFollowUps(): Promise<FollowUp[]> {
  return followUpRepo.getAllFollowUps()
}

export async function createFollowUp(data: {
  consultationId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  dueDate: string
  reason: string
  notes?: string
}): Promise<{ success: boolean; followUp?: FollowUp; error?: string }> {
  if (!data.dueDate.trim()) {
    return { success: false, error: 'Follow-up date is required.' }
  }
  if (!data.reason.trim()) {
    return { success: false, error: 'Follow-up reason is required.' }
  }

  const followUp = await followUpRepo.createFollowUp({
    ...data,
    status: 'PENDING',
  })

  return { success: true, followUp }
}

export async function updateFollowUpStatus(
  id: string,
  status: FollowUp['status']
): Promise<{ success: boolean; followUp?: FollowUp; error?: string }> {
  const updated = await followUpRepo.updateFollowUpStatus(id, status)
  if (!updated) return { success: false, error: 'Follow-up record not found.' }
  return { success: true, followUp: updated }
}
