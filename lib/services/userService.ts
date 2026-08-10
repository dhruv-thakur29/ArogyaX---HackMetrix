import * as userRepo from '@/lib/db/repositories/userRepo.mock'
import type { User } from '@/lib/types'

export async function getAllUsers(): Promise<User[]> {
  return userRepo.getAllUsers()
}

export async function getUserById(id: string): Promise<User | null> {
  return userRepo.getUserById(id)
}
