export type CourseType = 'online' | 'offline'

export type StudentSource = 'social_media' | 'referral' | 'friend' | 'other'

export interface RenewalRecord {
  id: string
  addedSessions: number
  addedFee: number
  remainingAtRenewal: number
  date: string
}

export interface Student {
  id: string
  name: string
  courseType: CourseType
  source: StudentSource
  totalSessions: number
  completedSessions: number
  totalFee: number
  sessionPrice: number
  venueFee: number
  sessionIncome: number
  trainingBackground: string
  trainingPlanPdf?: string
  contractPdf?: string
  renewalHistory: RenewalRecord[]
  createdAt: string
}

export type SessionStatus = 'planned' | 'completed'

export interface Session {
  id: string
  studentId: string
  date: string
  time: string
  location: string
  status: SessionStatus
  createdAt: string
}

export interface WeeklyStats {
  week: string
  revenue: number
  profit: number
  completedSessions: number
}

export interface MonthlyStats {
  month: string
  revenue: number
  profit: number
  completedSessions: number
}
