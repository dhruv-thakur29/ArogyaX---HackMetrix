import { mockStore } from '@/lib/db/mock/store'
import type { FollowUp } from '@/lib/types'

export async function getFollowUpsByDoctor(doctorId: string): Promise<FollowUp[]> {
  return mockStore.followUps
    .filter((f) => f.doctorId === doctorId || !f.doctorId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export async function getFollowUpsByPatient(patientId: string): Promise<FollowUp[]> {
  return mockStore.followUps
    .filter((f) => f.patientId === patientId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export async function getAllFollowUps(): Promise<FollowUp[]> {
  return [...mockStore.followUps].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )
}

export async function createFollowUp(
  data: Omit<FollowUp, 'id' | 'createdAt'>
): Promise<FollowUp> {
  const newFollowUp: FollowUp = {
    ...data,
    id: `flw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  mockStore.followUps.unshift(newFollowUp)
  return { ...newFollowUp }
}

export async function updateFollowUpStatus(
  id: string,
  status: FollowUp['status']
): Promise<FollowUp | null> {
  const f = mockStore.followUps.find((item) => item.id === id)
  if (!f) return null
  f.status = status
  return { ...f }
}
