import { getOfflineActions, deleteOfflineAction } from './indexedDB'
import { registerPatient } from '@/lib/services/patientService'
import { recordVitals } from '@/lib/services/vitalsService'
import { recordVaccination } from '@/lib/services/vaccinationService'
import { createEmergencyReferral } from '@/lib/services/emergencyService'

export async function processSyncQueue(): Promise<{ processedCount: number; errors: string[] }> {
  const actions = await getOfflineActions()
  if (actions.length === 0) return { processedCount: 0, errors: [] }

  let count = 0
  const errors: string[] = []

  for (const action of actions) {
    let synced = false
    try {
      if (action.type === 'REGISTER_PATIENT') {
        const res = await registerPatient(action.payload)
        if (res.success) synced = true
        else errors.push(res.error || 'Failed to register patient')
      } else if (action.type === 'RECORD_VITALS') {
        const res = await recordVitals(action.payload)
        if (res.success) synced = true
        else errors.push(res.error || 'Failed to record vitals')
      } else if (action.type === 'RECORD_VACCINE') {
        const { patientId, patientName, vaccineName, status, dueDate, administeredDate, administeredBy } =
          action.payload
        const res = await recordVaccination(
          patientId,
          patientName,
          vaccineName,
          status,
          dueDate,
          administeredDate,
          administeredBy
        )
        if (res.success) synced = true
        else errors.push(res.error || 'Failed to record vaccination')
      } else if (action.type === 'EMERGENCY_REFERRAL') {
        const res = await createEmergencyReferral(action.payload)
        if (res.success) synced = true
        else errors.push(res.error || 'Failed to process referral')
      }
    } catch (err: any) {
      errors.push(err?.message || 'Unknown sync error')
    }

    // Only remove the action from the queue once it has actually been
    // applied. Failed actions stay queued so the next sync attempt (manual
    // retry or next reconnect) can retry them, instead of being silently
    // discarded.
    if (synced) {
      count++
      await deleteOfflineAction(action.id)
    }
  }

  return { processedCount: count, errors }
}
