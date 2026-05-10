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
  trust: number
  execution: number
  cognition: number
  learning: number
  loyalty: number
}

export type StudentStatus = 'active' | 'paused' | 'ended'

// 身体信息
export interface BodyInfo {
  age?: number
  height?: number // cm
  weight?: number // kg
  bodyFatPercentage?: number // %
  trainingGoal?: string
  bodyPhotoUrl?: string
}

// 训练项目（在阶段中）
export interface TrainingProject {
  id: string
  name: string
  description: string
}

// 训练阶段
export interface TrainingPhase {
  id: string
  name: string
  duration: string // 例如 "4周"
  sessionCount: number // 对应节数
  trainingProjects: TrainingProject[]
  dietSuggestions: string
}

// 新的训练计划结构
export interface TrainingPlan {
  bodyInfo: BodyInfo
  overallStrategy: string // 整体训练策略（自由文本框）
  phases: TrainingPhase[]
}

// 单次训练效果记录
export interface TrainingEffectRecord {
  id: string
  date: string
  lessonNumber: number
  photoUrl: string
  summary: string
  createdAt: string
}

// 训练效果集合
export interface TrainingEffect {
  records: TrainingEffectRecord[]
}

// 单节课训练记录
export interface SessionRecord {
  id: string
  studentId: string
  lessonNumber: number
  date: string
  trainingItems: TrainingItem[]
  overallStatus: string
  statusNote: string
  coachMemo: string
  includeMemoInPdf: boolean
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  name: string
  phone?: string
  wechat?: string
  courseType: CourseType
  source: StudentSource
  totalSessions: number
  completedSessions: number
  totalFee: number
  sessionPrice: number
  venueFee: number
  sessionIncome: number
  trainingBackground: string
  trainingPlan?: TrainingPlan
  photos?: StudentPhotos
  trainingEffect?: TrainingEffect
  trainingPlanPdf?: string
  contractPdf?: string
  renewalHistory: RenewalRecord[]
  ratings?: RatingDimensions
  ratings_updated_at?: string
  createdAt: string
  status?: StudentStatus
  pausedAt?: string
  endedAt?: string
  refundAmount?: number
  refundAt?: string
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

export type ProgressColorType = 'success' | 'warning' | 'destructive'

export interface StudentProgressInfo {
  remaining: number
  completed: number
  total: number
  color: ProgressColorType
  percentage: number
}
