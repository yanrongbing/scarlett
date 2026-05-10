'use client'

import type { Student, ProgressColorType, RatingDimensions } from '@/lib/types'

/**
 * 根据剩余课时数判断进度条颜色
 * 剩余8节课以上 -> 绿色 (success)
 * 剩余3-8节 -> 黄色 (warning)
 * 剩余3节以内 -> 红色 (destructive)
 */
export function getProgressColor(remaining: number): ProgressColorType {
  if (remaining > 8) return 'success'
  if (remaining >= 3) return 'warning'
  return 'destructive'
}

/**
 * 获取学员进度信息
 */
export function getStudentProgress(student: Student) {
  const remaining = Math.max(0, student.totalSessions - student.completedSessions)
  const percentage = student.totalSessions > 0 
    ? Math.round((student.completedSessions / student.totalSessions) * 100)
    : 0
  
  return {
    remaining,
    completed: student.completedSessions,
    total: student.totalSessions,
    color: getProgressColor(remaining),
    percentage,
  }
}

/**
 * 计算五维评分的综合评分（平均值）
 */
export function calculateCompositeScore(ratings?: RatingDimensions): number {
  if (!ratings) return 0
  const sum = ratings.trust + ratings.execution + ratings.cognition + ratings.learning + ratings.loyalty
  return Math.round((sum / 5) * 10) / 10 // 保留一位小数
}

/**
 * 获取综合评分的百分制
 */
export function getScorePercentage(ratings?: RatingDimensions): number {
  const score = calculateCompositeScore(ratings)
  return Math.round(score * 20)
}

/**
 * 格式化利润数字（保留整数）
 */
export function formatProfit(value: number): string {
  return Math.round(value).toLocaleString('zh-CN')
}

/**
 * 获取周的显示文本 (e.g., "第1周")
 */
export function getWeekDisplay(weekOffset: number): string {
  if (weekOffset === 0) return '本周'
  if (weekOffset === -1) return '上周'
  if (weekOffset === 1) return '下周'
  return `第${Math.abs(weekOffset)}周`
}

/**
 * 获取当前周的起始日期
 */
export function getWeekStart(offset = 0): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // 调整为周一
  const monday = new Date(today.setDate(diff + offset * 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * 判断日期是否在某一周内
 */
export function isInWeek(date: Date, weekOffset: number): boolean {
  const weekStart = getWeekStart(weekOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return checkDate >= weekStart && checkDate < weekEnd
}

/**
 * 计算最近N周的周数范围
 */
export function getRecentWeeksRange(weeks: number): { start: Date; end: Date } {
  const end = getWeekStart(1) // 下周开始
  const start = new Date(end)
  start.setDate(start.getDate() - weeks * 7)
  return { start, end }
}
