import { mockStore } from '@/lib/db/mock/store'
import type { User } from '@/lib/types'

export async function getAllUsers(): Promise<User[]> {
  return [...mockStore.users]
}

export async function getUserById(id: string): Promise<User | null> {
  return mockStore.users.find((u) => u.id === id) ?? null
}
