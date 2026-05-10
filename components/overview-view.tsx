'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Target, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Student, Session } from '@/lib/types'
import { getStudentProgress, formatProfit, getProgressColor } from '@/lib/utils-helper'

interface OverviewViewProps {
  students: Student[]
  sessions: Session[]
  getStudent: (id: string) => Student | undefined
  onSelectStudent?: (student: Student) => void
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

export function OverviewView({ students, sessions, getStudent, onSelectStudent }: OverviewViewProps) {
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

  // 学员来源统计
  const sourceStats = useMemo(() => {
    const stats: Record<string, number> = {
      social_media: 0,
      referral: 0,
      friend: 0,
      other: 0,
    }
    
    students.forEach(s => {
      const source = s.source || 'other'
      stats[source] = (stats[source] || 0) + 1
    })
    
    return stats
  }, [students])

  // 学员进度 - 按消耗进度排序
  const studentProgress = useMemo(() => {
    return students
      .map(student => ({
        student,
        progress: getStudentProgress(student),
      }))
      .sort((a, b) => b.progress.percentage - a.progress.percentage)
  }, [students])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">情况总览</h1>
        <p className="text-muted-foreground mt-1">姜贝果教练私教课情况</p>
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
            <div className="text-3xl font-bold text-foreground">¥{formatProfit(weekStats.profit)}</div>
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
            <div className="text-3xl font-bold text-foreground">¥{formatProfit(monthStats.profit)}</div>
            <p className="text-xs text-muted-foreground mt-1">基于已完成课程</p>
          </CardContent>
        </Card>
      </div>

      {/* 每周利润趋势图 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">每周利润趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyProfitTrend.some(w => w.profit > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyProfitTrend}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              暂无数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 未来30天收入预期 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">未来30天收入预期</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">已确认收入</p>
            <p className="text-2xl font-bold text-foreground">¥{formatProfit(futureIncomeProjection.confirmed)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">预期收入（待确认续课）</p>
            <p className="text-2xl font-bold text-foreground">¥{formatProfit(futureIncomeProjection.pending)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 学员来源统计 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">学员来源统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">来源</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">人数</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">占比</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sourceStats).map(([source, count]) => (
                  <tr key={source} className="border-b border-border hover:bg-muted/50">
                    <td className="py-2 px-3 text-foreground">{sourceLabels[source]}</td>
                    <td className="py-2 px-3 text-right font-medium">{count}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {students.length > 0 ? `${Math.round((count / students.length) * 100)}%` : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 学员进度 */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer -ml-4"
            asChild
          >
            <div>学员进度</div>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studentProgress.length > 0 ? (
              studentProgress.map(({ student, progress }) => (
                <div key={student.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{student.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Progress 
                        value={progress.percentage}
                        className={`h-2 bg-muted`}
                        style={{
                          '--progress-color': 
                            progress.color === 'success' ? 'hsl(var(--success))' :
                            progress.color === 'warning' ? 'hsl(var(--warning))' :
                            'hsl(var(--destructive))'
                        } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-8 text-right">
                      {progress.remaining}
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
