'use client'

import React, { useState } from 'react'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOffline } from '@/lib/offline/offlineContext'

export default function HealthWorkerOfflineQueuePage() {
  const {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncError,
    toggleOnlineStatus,
    queueAction,
    syncNow,
  } = useOffline()

  const [testPatientName, setTestPatientName] = useState('Kamla Devi')
  const [testBp, setTestBp] = useState('125/82')
  const [testTemp, setTestTemp] = useState('37.2')

  const handleSimulateOfflineRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    await queueAction('RECORD_VITALS', {
      patientId: 'pat_1',
      patientName: testPatientName,
      temperatureCelsius: parseFloat(testTemp),
      bloodPressureSys: parseInt(testBp.split('/')[0] || '120'),
      bloodPressureDia: parseInt(testBp.split('/')[1] || '80'),
      heartRateBpm: 76,
      oxygenSatPercent: 98,
      recordedBy: 'Sunita Yadav (Offline Field Test)',
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Offline-First Architecture
          </Badge>
          <span className="text-xs text-muted-foreground">IndexedDB &amp; Sync Queue Engine</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl mt-1">
          Offline Data Capture &amp; Synchronization
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulate offline field data collection. When internet connectivity drops, actions are stored safely in local IndexedDB storage and synced seamlessly once connectivity is restored.
        </p>
      </div>

      {/* Online/Offline Simulator Card */}
      <Card className={isOnline ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-6 w-6 text-emerald-600 animate-pulse" />
              ) : (
                <WifiOff className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <CardTitle className="text-lg font-bold">
                  Status: {isOnline ? 'Online (Connected)' : 'Offline Simulation Active'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isOnline
                    ? 'Connected to server. Offline queue will automatically sync.'
                    : 'Disconnected from network. All actions will queue locally.'}
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={toggleOnlineStatus}
              variant={isOnline ? 'outline' : 'default'}
              size="sm"
              className="gap-2 font-semibold"
            >
              {isOnline ? <WifiOff className="h-4 w-4 text-amber-600" /> : <Wifi className="h-4 w-4" />}
              {isOnline ? 'Simulate Disconnection (Go Offline)' : 'Reconnect Network (Go Online)'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Offline Action Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Simulate Field Action Entry
            </CardTitle>
            <CardDescription>
              Record a vital sign entry while in offline or online state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSimulateOfflineRecord} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Patient Name:</label>
                <input
                  type="text"
                  value={testPatientName}
                  onChange={(e) => setTestPatientName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-2.5"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Blood Pressure (Sys/Dia):</label>
                  <input
                    type="text"
                    value={testBp}
                    onChange={(e) => setTestBp(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Temp (°C):</label>
                  <input
                    type="text"
                    value={testTemp}
                    onChange={(e) => setTestTemp(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background p-2.5"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 font-semibold">
                <Database className="h-4 w-4" /> Save Record to Offline Queue
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sync Queue Manager */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" /> Pending Action Queue
              </CardTitle>
              <Badge variant={pendingCount > 0 ? 'warning' : 'secondary'} className="font-bold">
                {pendingCount} Items Queued
              </Badge>
            </div>
            <CardDescription>Actions saved locally awaiting sync to server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-lg bg-muted/40 p-4 border border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Queue Status:</span>
                <span className="font-bold text-foreground">
                  {pendingCount === 0 ? 'Queue Clean & Synced' : `${pendingCount} item(s) pending`}
                </span>
              </div>

              {lastSyncTime && (
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Last Sync Attempt:</span>
                  <span>{lastSyncTime}</span>
                </div>
              )}

              {syncError && (
                <p className="text-xs font-semibold text-destructive">{syncError}</p>
              )}
            </div>

            <Button
              onClick={() => syncNow()}
              disabled={!isOnline || pendingCount === 0 || isSyncing}
              className="w-full gap-2 font-bold"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronizing Queue...' : 'Force Sync Pending Queue Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
