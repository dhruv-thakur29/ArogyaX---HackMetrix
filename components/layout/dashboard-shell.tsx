'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ElementType } from 'react'
import {
  Activity,
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Siren,
  Stethoscope,
  Syringe,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { RoleBadge } from '@/components/layout/role-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { logoutAction } from '@/lib/auth/actions'
import type { SessionUser, UserRole } from '@/lib/types'
import { useOffline } from '@/lib/offline/offlineContext'

interface NavItem {
  href: string
  label: string
  icon: ElementType
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  patient: [
    { href: '/dashboard/patient', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/patient/symptom-checker', label: 'Symptom Checker', icon: Activity },
    { href: '/dashboard/patient/consultations', label: 'Consultations', icon: Stethoscope },
    { href: '/dashboard/patient/health-records', label: 'Health Records', icon: FileText },
    { href: '/dashboard/patient/vaccinations', label: 'Vaccinations', icon: Syringe },
    { href: '/dashboard/patient/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { href: '/dashboard/patient/emergency', label: 'Emergency', icon: Siren },
  ],
  doctor: [
    { href: '/dashboard/doctor', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/doctor/queue', label: 'Patient Queue', icon: Users },
    { href: '/dashboard/doctor/consultations', label: 'Consultations', icon: Stethoscope },
    { href: '/dashboard/doctor/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { href: '/dashboard/doctor/follow-ups', label: 'Follow-ups', icon: FileText },
  ],
  health_worker: [
    { href: '/dashboard/health-worker', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/health-worker/patients', label: 'Patients & Register', icon: UserPlus },
    { href: '/dashboard/health-worker/vitals', label: 'Collect Vitals', icon: Activity },
    { href: '/dashboard/health-worker/vaccinations', label: 'Vaccinations', icon: Syringe },
    { href: '/dashboard/health-worker/emergency', label: 'Emergency Referral', icon: Siren },
    { href: '/dashboard/health-worker/offline', label: 'Offline Queue', icon: WifiOff },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
    { href: '/dashboard/admin/consultations', label: 'Consultations', icon: Stethoscope },
    { href: '/dashboard/admin/vaccinations', label: 'Vaccinations', icon: Syringe },
    { href: '/dashboard/admin/emergency', label: 'Emergency Referrals', icon: Siren },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ],
}

export function DashboardShell({
  user,
  title,
  children,
}: {
  user: SessionUser
  title: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isOnline, pendingCount, isSyncing, toggleOnlineStatus, syncNow } = useOffline()

  const navItems = NAV_ITEMS[user.role] ?? []

  return (
    <div className="flex min-h-screen bg-muted/10 font-sans text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">ArogyaX</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? 'flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all'
                    : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden text-xs">
              <p className="truncate font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit" className="w-full justify-start gap-2 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-display text-lg font-semibold text-foreground md:text-xl">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline/Online Toggle Button for Hackathon Demo */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs">
              <button
                onClick={toggleOnlineStatus}
                className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-80"
                title="Click to toggle network simulation"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Wifi className="h-3 w-3" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <WifiOff className="h-3 w-3" /> Offline Mode
                  </span>
                )}
              </button>

              {pendingCount > 0 && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  {pendingCount} queued
                </Badge>
              )}

              {isOnline && pendingCount > 0 && (
                <button
                  onClick={() => syncNow()}
                  disabled={isSyncing}
                  className="text-primary hover:text-primary/80 disabled:opacity-50"
                  title="Sync offline queue now"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            <RoleBadge role={user.role} />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex bg-background/80 backdrop-blur-sm md:hidden">
            <div className="w-64 border-r border-border bg-card p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-display font-bold">ArogyaX Menu</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={
                        isActive
                          ? 'flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground'
                          : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p>{user.email}</p>
                </div>
                <form action={logoutAction}>
                  <Button variant="outline" size="sm" type="submit" className="w-full justify-start gap-2 text-xs">
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}