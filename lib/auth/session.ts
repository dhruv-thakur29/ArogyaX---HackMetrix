import { cookies } from 'next/headers'
import type { SessionUser } from '@/lib/types'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

export { SESSION_COOKIE_NAME }

// NOTE (assumption): base64-encoded JSON cookie — prototype only, NOT signed
// or encrypted. This must be replaced with a signed session (JWT /
// iron-session) before any real patient data flows through this app.

function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), 'utf-8').toString('base64')
}

function decodeSession(value: string): SessionUser | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf-8')) as SessionUser
  } catch {
    return null
  }
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, encodeSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE_NAME)
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE_NAME)?.value
  if (!raw) return null
  return decodeSession(raw)
}