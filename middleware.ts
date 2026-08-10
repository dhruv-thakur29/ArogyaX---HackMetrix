import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, ROLE_DASHBOARD_PREFIX } from '@/lib/auth/constants'
import type { UserRole } from '@/lib/types'

function decodeSessionEdge(value: string): { role: UserRole } | null {
  try {
    return JSON.parse(atob(value)) as { role: UserRole }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!raw) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const session = decodeSessionEdge(raw)

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const allowedPrefix = ROLE_DASHBOARD_PREFIX[session.role]

  if (!allowedPrefix || !pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}