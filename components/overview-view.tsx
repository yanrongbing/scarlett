'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, Calendar, TrendingUp, Target, Clock } from 'lucide-react'

import type { Student, Session } from '@/lib/types'

interface OverviewViewProps {
  students: Student[]
  sessions: Session[]
  getStudent: (id: string) => Student | undefined
}

const sourceLabels: Record<string, string> = {
  social_media: '社媒',
  referral: '转介绍',
  friend: '朋友',
  other: '其他',
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

export function OverviewView({ students, sessions, getStudent }: OverviewViewProps) {
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
    
    // 本周利润 = 每个已完成课程学员的 (单次课费 - 场地费)
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

  // 未来30天收入预期
  const futureIncome = useMemo(() => {
    const now = new Date()
    const futureEnd = new Date(now)
    futureEnd.setDate(futureEnd.getDate() + 30)
    const nowStr = now.toISOString().split('T')[0]
    const endStr = futureEnd.toISOString().split('T')[0]

    // 已排课的未来课程（已确认收入）
    const futurePlannedSessions = sessions.filter(
      s => s.date >= nowStr && s.date <= endStr && s.status === 'planned'
    )
    
    let confirmedIncome = 0
    futurePlannedSessions.forEach(session => {
      const student = getStudent(session.studentId)
      if (student) {
        confirmedIncome += student.sessionIncome || (student.sessionPrice - student.venueFee)
      }
    })
    
    // 未确认的续课收入（预期收入）
    let pendingIncome = 0
    students.forEach(student => {
      const pendingRenewals = (student.renewalHistory || []).filter(r => !r.confirmed)
      pendingRenewals.forEach(renewal => {
        const perSession = renewal.addedSessions > 0 
          ? (renewal.addedFee / renewal.addedSessions) - (renewal.addedVenueFee || 0)
          : 0
        pendingIncome += perSession * renewal.addedSessions
      })
    })
    
    return {
      confirmed: confirmedIncome,
      pending: pendingIncome,
      total: confirmedIncome + pendingIncome,
      plannedSessionCount: futurePlannedSessions.length,
    }
  }, [sessions, students, getStudent])

  // Student progress data
  const studentProgressData = useMemo(() => {
    return students.map(student => {
      const studentSessions = sessions.filter(s => s.studentId === student.id && s.status === 'completed')
      const completed = studentSessions.length
      const remaining = student.totalSessions - completed
      const progress = student.totalSessions > 0 ? (completed / student.totalSessions) * 100 : 0
      
      return {
        name: student.name,
        completed,
        remaining: Math.max(0, remaining),
        progress,
      }
    }).slice(0, 6)
  }, [students, sessions])

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">情况总览</h2>
        <p className="text-sm text-muted-foreground">姜贝果教练私教课情况</p>
      </div>

      {/* 本周数据 - compact */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 px-3 pt-2 md:px-4 md:pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            本周数据
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2 md:px-4 md:pb-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-1.5 md:p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">上课人数</div>
              <div className="text-base md:text-lg font-bold text-foreground">{weekStats.studentCount}</div>
            </div>
            <div className="text-center p-1.5 md:p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">课时进度</div>
              <div className="text-base md:text-lg font-bold text-foreground">
                {weekStats.completedCount}/{weekStats.totalScheduled}
              </div>
            </div>
            <div className="text-center p-1.5 md:p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">本周利润</div>
              <div className="text-base md:text-lg font-bold text-success">¥{weekStats.profit.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 本月数据 - compact */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 px-3 pt-2 md:px-4 md:pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            本月数据
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2 md:px-4 md:pb-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-1.5 md:p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">上课人数</div>
              <div className="text-base md:text-lg font-bold text-foreground">{monthStats.studentCount}</div>
            </div>
            <div className="text-center p-1.5 md:p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">已完成课时</div>
              <div className="text-base md:text-lg font-bold text-foreground">{monthStats.completedCount}</div>
            </div>
            <div className="text-center p-1.5 md:p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">本月利润</div>
              <div className="text-base md:text-lg font-bold text-success">¥{monthStats.profit.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 未来30天收入预期 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 px-3 pt-2 md:px-4 md:pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            未来30天收入预期
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-4 md:pb-4">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-1.5 md:p-2 rounded bg-primary/10 border border-primary/20">
              <div className="text-xs text-muted-foreground">已确认收入</div>
              <div className="text-base md:text-lg font-bold text-primary">¥{futureIncome.confirmed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{futureIncome.plannedSessionCount}节已排</div>
            </div>
            <div className="text-center p-1.5 md:p-2 rounded bg-warning/10 border border-warning/20">
              <div className="text-xs text-muted-foreground">预期收入</div>
              <div className="text-base md:text-lg font-bold text-warning">¥{futureIncome.pending.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">续课未确认</div>
            </div>
            <div className="text-center p-1.5 md:p-2 rounded bg-success/10 border border-success/20">
              <div className="text-xs text-muted-foreground">合计预期</div>
              <div className="text-base md:text-lg font-bold text-success">¥{futureIncome.total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">30天内</div>
            </div>
          </div>
          {futureIncome.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">已确认占比</span>
                <span className="text-foreground">
                  {futureIncome.total > 0 ? ((futureIncome.confirmed / futureIncome.total) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <Progress 
                value={futureIncome.total > 0 ? (futureIncome.confirmed / futureIncome.total) * 100 : 0} 
                className="h-1.5"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Source Table */}
      <Card className="bg-card border-border">
          <CardHeader className="px-3 pt-2 pb-1 md:px-4 md:pt-3">
            <CardTitle className="text-sm text-foreground">学员来源统计</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-4 md:pb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">来源</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">人数</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">占比</th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground">课程收费</th>
                  </tr>
                </thead>
                <tbody>
                  {['social_media', 'referral', 'friend', 'other'].map((source) => {
                    const sourceStudents = students.filter(s => (s.source || 'other') === source)
                    const count = sourceStudents.length
                    const percentage = students.length > 0 ? ((count / students.length) * 100).toFixed(1) : '0'
                    const totalFee = sourceStudents.reduce((sum, s) => sum + (s.totalFee || 0), 0)
                    
                    return (
                      <tr key={source} className="border-b border-border last:border-b-0">
                        <td className="px-2 py-1.5 text-xs text-foreground">{sourceLabels[source]}</td>
                        <td className="px-2 py-1.5 text-xs text-center text-foreground">{count}</td>
                        <td className="px-2 py-1.5 text-xs text-center text-foreground">{percentage}%</td>
                        <td className="px-2 py-1.5 text-xs text-right text-primary font-medium">¥{totalFee.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      {/* Student Progress */}
      <Card className="bg-card border-border">
        <CardHeader className="px-3 pt-2 pb-1 md:px-4 md:pt-3">
          <CardTitle className="text-sm text-foreground">学员进度</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-4 md:pb-4">
          {studentProgressData.length > 0 ? (
            <div className="space-y-2">
              {studentProgressData.map((student, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{student.name}</span>
                    <span className="text-muted-foreground">
                      {student.completed} / {student.completed + student.remaining}
                    </span>
                  </div>
                  <Progress value={student.progress} className="h-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[80px] flex items-center justify-center text-muted-foreground text-sm">
              暂无学员
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
