'use client'

import React from 'react'
import { SymptomChat } from '@/components/patient/symptom-chat'

export default function SymptomCheckerPage() {
  return (
    <div className="p-1 md:p-2 lg:p-3 h-[calc(100vh-4rem)] overflow-hidden bg-muted/20 rounded-2xl">
      <SymptomChat patientName="Asha Devi" patientAge={34} patientGender="Female" patientVillage="Rampur" />
    </div>
  )
}
