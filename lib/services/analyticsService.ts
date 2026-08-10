import { mockStore } from '@/lib/db/mock/store'

export async function getAdminKPIs() {
  const totalPatients = mockStore.patients.length
  const totalUsers = mockStore.users.length
  const totalDoctors = mockStore.users.filter((u) => u.role === 'doctor').length
  const totalHealthWorkers = mockStore.users.filter((u) => u.role === 'health_worker').length
  const totalConsultations = mockStore.consultations.length
  const totalVaccinations = mockStore.vaccinations.length
  const completedVaccinations = mockStore.vaccinations.filter((v) => v.status === 'COMPLETED').length
  const emergencyReferrals = mockStore.emergencyReferrals.length

  return {
    totalPatients,
    totalUsers,
    totalDoctors,
    totalHealthWorkers,
    totalConsultations,
    totalVaccinations,
    completedVaccinations,
    emergencyReferrals,
  }
}

export async function getAnalyticsData() {
  const consultationsByStatus = [
    { status: 'Requested', count: mockStore.consultations.filter((c) => c.status === 'REQUESTED').length },
    { status: 'Accepted', count: mockStore.consultations.filter((c) => c.status === 'ACCEPTED').length },
    { status: 'In Progress', count: mockStore.consultations.filter((c) => c.status === 'IN_PROGRESS').length },
    { status: 'Completed', count: mockStore.consultations.filter((c) => c.status === 'COMPLETED').length },
  ]

  const vaccinationsByStatus = [
    { status: 'Completed', count: mockStore.vaccinations.filter((v) => v.status === 'COMPLETED').length },
    { status: 'Upcoming', count: mockStore.vaccinations.filter((v) => v.status === 'UPCOMING').length },
    { status: 'Overdue', count: mockStore.vaccinations.filter((v) => v.status === 'OVERDUE').length },
  ]

  const usersByRole = [
    { role: 'Patient', count: mockStore.users.filter((u) => u.role === 'patient').length },
    { role: 'Doctor', count: mockStore.users.filter((u) => u.role === 'doctor').length },
    { role: 'Health Worker', count: mockStore.users.filter((u) => u.role === 'health_worker').length },
    { role: 'Admin', count: mockStore.users.filter((u) => u.role === 'admin').length },
  ]

  const consultationTrends = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 9 },
    { day: 'Fri', count: 12 },
    { day: 'Sat', count: 8 },
    { day: 'Sun', count: 6 },
  ]

  return {
    consultationsByStatus,
    vaccinationsByStatus,
    usersByRole,
    consultationTrends,
  }
}
