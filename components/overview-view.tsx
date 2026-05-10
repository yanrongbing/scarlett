'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Users, TrendingUp, Target, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Student, Session } from '@/lib/types'
import { getStudentProgress, formatProfit, getProgressColor } from '@/lib/utils-helper'

interface OverviewViewProps {
  students: Student[]
  sessions: Session[]
  getStudent: (id: string) => Student | undefined
  onSelectStudent?: (student: Student) => void
  onTabChange?: (tab: string) => void
}



function getWeekRange(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { start: monday, end: sunday }
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

type TrendMode = 'weekly' | 'monthly' | 'yearly'

export function OverviewView({ students, sessions, getStudent, onSelectStudent, onTabChange }: OverviewViewProps) {
  const [trendMode, setTrendMode] = useState<TrendMode>('weekly')

  // 全局汇总数据
  const globalStats = useMemo(() => {
    // 总计学员数（排除已结课）
    const totalStudents = students.filter(s => s.status !== 'ended').length
    
    // 总计利润（所有已完成课程的利润）
    const completedSessions = sessions.filter(s => s.status === 'completed')
    let totalProfit = 0
    completedSessions.forEach(session => {
      const student = getStudent(session.studentId)
      if (student) {
        totalProfit += student.sessionIncome || (student.sessionPrice - student.venueFee)
      }
    })
    
    // 总计课时（所有已完成课程数）
    const totalSessions = completedSessions.length
    
    // 剩余课时数（所有未结课学员的剩余课时总和）
    let remainingSessions = 0
    students.filter(s => s.status !== 'ended').forEach(student => {
      const completed = sessions.filter(
        s => s.studentId === student.id && s.status === 'completed'
      ).length
      const remaining = student.totalSessions - completed
      if (remaining > 0) {
        remainingSessions += remaining
      }
    })
    
    return { totalStudents, totalProfit, totalSessions, remainingSessions }
  }, [students, sessions, getStudent])

  // 本周数据
  const weekStats = useMemo(() => {
    const now = new Date()
    const { start, end } = getWeekRange(now)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    
    const weekSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr)
    const completedSessions = weekSessions.filter(s => s.status === 'completed')
    
    const uniqueStudentIds = new Set(completedSessions.map(s => s.studentId))
    const weekStudentCount = uniqueStudentIds.size
    
    const completedCount = completedSessions.length
    const totalScheduled = weekSessions.length
    
    let weekProfit = 0
    completedSessions.forEach(session => {
      const student = getStudent(session.studentId)
      if (student) {
        weekProfit += student.sessionIncome || (student.sessionPrice - student.venueFee)
      }
    })
    
    return {
      studentCount: weekStudentCount,
      completedCount,
      totalScheduled,
      profit: weekProfit,
    }
  }, [sessions, getStudent])

  // 本月数据
  const monthStats = useMemo(() => {
    const now = new Date()
    const { start, end } = getMonthRange(now)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    
    const monthSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr)
    const completedSessions = monthSessions.filter(s => s.status === 'completed')
    
    const uniqueStudentIds = new Set(completedSessions.map(s => s.studentId))
    const monthStudentCount = uniqueStudentIds.size
    
    const completedCount = completedSessions.length
    
    let monthProfit = 0
    completedSessions.forEach(session => {
      const student = getStudent(session.studentId)
      if (student) {
        monthProfit += student.sessionIncome || (student.sessionPrice - student.venueFee)
      }
    })
    
    return {
      studentCount: monthStudentCount,
      completedCount,
      profit: monthProfit,
    }
  }, [sessions, getStudent])

  // 每周利润趋势 - 最近12周
  const weeklyProfitTrend = useMemo(() => {
    const data = []
    const today = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const weekDate = new Date(today)
      weekDate.setDate(weekDate.getDate() - i * 7)
      const { start, end } = getWeekRange(weekDate)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]
      
      const weekSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr && s.status === 'completed')
      
      let profit = 0
      weekSessions.forEach(session => {
        const student = getStudent(session.studentId)
        if (student) {
          profit += student.sessionIncome || (student.sessionPrice - student.venueFee)
        }
      })
      
      const weekNum = Math.floor((today.getTime() - weekDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const label = weekNum === 0 ? '本周' : weekNum === 1 ? '上周' : `${weekNum}周前`
      
      data.push({
        name: label,
        profit: Math.round(profit),
      })
    }
    
    return data
  }, [sessions, getStudent])

  // 每月利润趋势 - 最近12个月
  const monthlyProfitTrend = useMemo(() => {
    const data = []
    const today = new Date()

    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      const monthSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr && s.status === 'completed')

      let profit = 0
      monthSessions.forEach(session => {
        const student = getStudent(session.studentId)
        if (student) {
          profit += student.sessionIncome || (student.sessionPrice - student.venueFee)
        }
      })

      const monthLabel = i === 0 ? '本月' : `${d.getMonth() + 1}月`

      data.push({ name: monthLabel, profit: Math.round(profit) })
    }

    return data
  }, [sessions, getStudent])

  // 每年利润趋势 - 最近5年
  const yearlyProfitTrend = useMemo(() => {
    const data = []
    const today = new Date()

    for (let i = 4; i >= 0; i--) {
      const year = today.getFullYear() - i
      const startStr = `${year}-01-01`
      const endStr = `${year}-12-31`

      const yearSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr && s.status === 'completed')

      let profit = 0
      yearSessions.forEach(session => {
        const student = getStudent(session.studentId)
        if (student) {
          profit += student.sessionIncome || (student.sessionPrice - student.venueFee)
        }
      })

      data.push({ name: `${year}年`, profit: Math.round(profit) })
    }

    return data
  }, [sessions, getStudent])

  // 当前趋势数据
  const currentTrendData = trendMode === 'weekly'
    ? weeklyProfitTrend
    : trendMode === 'monthly'
    ? monthlyProfitTrend
    : yearlyProfitTrend

  const trendLabels: Record<TrendMode, string> = {
    weekly: '每周利润趋势',
    monthly: '每月利润趋势',
    yearly: '每年利润趋势',
  }

  // 未来30天收入预期
  const futureIncomeProjection = useMemo(() => {
    const confirmedIncome = {
      label: '已确认收入',
      amount: 0,
    }
    const pendingIncome = {
      label: '预期收入（待确认续课）',
      amount: 0,
    }
    
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const endStr = thirtyDaysLater.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]
    
    // 已排课的确认收入
    const futureSessions = sessions.filter(s => s.date >= today && s.date <= endStr)
    futureSessions.forEach(session => {
      const student = getStudent(session.studentId)
      if (student) {
        confirmedIncome.amount += student.sessionIncome || (student.sessionPrice - student.venueFee)
      }
    })
    
    // 待确认续课的预期收入
    students.forEach(student => {
      const pendingRenewals = (student.renewalHistory || []).filter(r => !r.confirmed)
      pendingRenewals.forEach(renewal => {
        const singleIncome = (renewal.addedFee / renewal.addedSessions) - (renewal.addedVenueFee || 0)
        pendingIncome.amount += singleIncome * renewal.addedSessions
      })
    })
    
    return {
      confirmed: Math.round(confirmedIncome.amount),
      pending: Math.round(pendingIncome.amount),
    }
  }, [students, sessions, getStudent])

  // 学员进度 - 按消耗进度排序，过滤掉剩余0节、暂停和结课学员
  const studentProgress = useMemo(() => {
    const now = new Date()
    return students
      .filter(student => {
        // 排除结课学员
        if (student.status === 'ended') return false
        // 排除暂停中的学员（30天内）
        if (student.status === 'paused' && student.pausedAt) {
          const pausedDate = new Date(student.pausedAt)
          const daysSincePaused = (now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysSincePaused < 30) return false
        }
        return true
      })
      .map(student => ({
        student,
        progress: getStudentProgress(student, sessions),
      }))
      .filter(item => item.progress.remaining > 0) // 过滤掉剩余0节的学员
      .sort((a, b) => b.progress.percentage - a.progress.percentage)
  }, [students])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">情况总览</h1>
        <p className="text-muted-foreground mt-1">姜贝果教练私教课情况</p>
      </div>

      {/* 全局汇总数据 - 4列布局 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              总计学员数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{globalStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">在训学员</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-success/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              总计利润
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-success">¥{formatProfit(globalStats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">累计收益</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-foreground" />
              总计课时
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{globalStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">已完成课程</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              剩余课时
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-warning">{globalStats.remainingSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">待消耗</p>
          </CardContent>
        </Card>
      </div>

      {/* 本周数据和本月数据 - 3列布局 */}
      <div className="grid gap-3 lg:grid-cols-6">
        {/* 本周数据 - 3列 */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本周上课人数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{weekStats.studentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">已完成 {weekStats.completedCount} 课时</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本周课时进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {weekStats.completedCount}/{weekStats.totalScheduled}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {weekStats.totalScheduled > 0 
                ? `${Math.round((weekStats.completedCount / weekStats.totalScheduled) * 100)}%`
                : '暂无排课'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本周利润</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">¥{formatProfit(weekStats.profit)}</div>
            <p className="text-xs text-muted-foreground mt-1">基于已完成课程</p>
          </CardContent>
        </Card>

        {/* 本月数据 - 3列 */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本月上课人数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{monthStats.studentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">已完成 {monthStats.completedCount} 课时</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本月课时数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{monthStats.completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">已完成课时</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本月利润</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">¥{formatProfit(monthStats.profit)}</div>
            <p className="text-xs text-muted-foreground mt-1">基于已完成课程</p>
          </CardContent>
        </Card>
      </div>

      {/* 利润趋势图 */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">利润趋势</CardTitle>
          <Select value={trendMode} onValueChange={(v) => setTrendMode(v as TrendMode)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">每周利润趋势</SelectItem>
              <SelectItem value="monthly">每月利润趋势</SelectItem>
              <SelectItem value="yearly">每年利润趋势</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {currentTrendData.some(w => w.profit > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={currentTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '11px' }}
                  tickMargin={8}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '11px' }}
                  tickFormatter={(value) => `¥${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`¥${value.toLocaleString('zh-CN')}`, '利润']}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={3}
                  connectNulls={true}
                  dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2, fill: '#10b981' }}
                  label={({ x, y, value }) => (
                    <text
                      x={x}
                      y={y - 12}
                      fill="#10b981"
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                    >
                      {value > 0 ? `¥${value}` : ''}
                    </text>
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
              暂无{trendLabels[trendMode]}数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 未来30天待续课收入 */}
      {futureIncomeProjection.pending > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">未来30天待续课收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">计划续课收入（待确认）</p>
              <p className="text-2xl font-bold text-success">¥{formatProfit(futureIncomeProjection.pending)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 学员进度 */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle 
            className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
            onClick={() => onTabChange?.('students')}
          >
            学员进度
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studentProgress.length > 0 ? (
              studentProgress.map(({ student, progress }) => (
                <div 
                  key={student.id} 
                  className="space-y-1 cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded transition-colors"
                  onClick={() => onSelectStudent?.(student)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{student.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={
                          progress.color === 'success' 
                            ? "h-full transition-all rounded-full bg-success"
                            : progress.color === 'warning'
                            ? "h-full transition-all rounded-full bg-warning"
                            : "h-full transition-all rounded-full bg-destructive"
                        }
                        style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                      />
                    </div>
                    <span className={
                      progress.color === 'success'
                        ? "text-xs min-w-8 text-right font-medium text-success"
                        : progress.color === 'warning'
                        ? "text-xs min-w-8 text-right font-medium text-warning"
                        : "text-xs min-w-8 text-right font-medium text-destructive"
                    }>
                      剩{progress.remaining}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">暂无学员</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
