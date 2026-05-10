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

// 训练计划
export interface TrainingPlan {
  goal: string          // 当前训练目标
  focus: string         // 当前训练重点
  mainExercises: string // 主要训练动作/训练方向
  precautions: string   // 注意事项
  stagePlan: string     // 阶段计划说明
  coachNotes: string    // 教练备注
}

// 照片条目
export interface PhotoEntry {
  url: string
  note?: string
  uploadedAt: string
}

// 学员照片
export interface StudentPhotos {
  beforePhotos: PhotoEntry[]
  afterPhotos: PhotoEntry[]
  progressPhotos: PhotoEntry[]
}

// 单个训练动作记录
export interface TrainingItem {
  id: string
  exerciseName: string
  sets: string
  repsWeightDuration: string
  statusAssessment: string
}

// 训练效果
export interface TrainingEffect {
  beforePhotos: PhotoEntry[]
  afterPhotos: PhotoEntry[]
  trainingFocus: string
  keyResults: string
  summary: string
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
