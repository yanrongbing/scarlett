export type CourseType = 'online' | 'offline'

export type StudentSource = 'social_media' | 'referral' | 'friend' | 'other'

export interface RenewalRecord {
  id: string
  addedSessions: number
  addedFee: number
  addedVenueFee: number
  remainingAtRenewal: number
  date: string
  confirmed: boolean
}

export interface RatingDimensions {
  trust: number // 信任度
  execution: number // 执行力
  cognition: number // 认知水平
  learning: number // 求知欲
  loyalty: number // 粘性
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
  ratings?: RatingDimensions // 五维评分
  ratings_updated_at?: string
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

// Utility types for progress color determination
export type ProgressColorType = 'success' | 'warning' | 'destructive'

export interface StudentProgressInfo {
  remaining: number
  completed: number
  total: number
  color: ProgressColorType
  percentage: number
}
