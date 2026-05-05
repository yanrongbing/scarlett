'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, Calendar, TrendingUp, Target, Clock } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
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

const SOURCE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']

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
    const plannedSessions = weekSessions.filter(s => s.status === 'planned')
    
    // 本周上课人数（已完成的不重复学员）
    const uniqueStudentIds = new Set(completedSessions.map(s => s.studentId))
    const weekStudentCount = uniqueStudentIds.size
    
    // 本周课时进度
    const completedCount = completedSessions.length
    const totalScheduled = weekSessions.length
    
    // 本周利润（基于已完成课程的学员）
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
    
    // 本月上课人数（已完成的不重复学员）
    const uniqueStudentIds = new Set(completedSessions.map(s => s.studentId))
    const monthStudentCount = uniqueStudentIds.size
    
    // 本月已完成课时
    const completedCount = completedSessions.length
    
    // 本月利润
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

  // Generate weekly revenue data
  const weeklyData = useMemo(() => {
    const weeks: Record<string, { week: string; revenue: number; profit: number; sessions: number }> = {}
    const completedSessions = sessions.filter(s => s.status === 'completed')
    
    completedSessions.forEach(session => {
      const date = new Date(session.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay() + 1)
      const weekKey = weekStart.toISOString().split('T')[0]
      
      const student = getStudent(session.studentId)
      if (!student) return
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          revenue: 0,
          profit: 0,
          sessions: 0,
        }
      }
      
      weeks[weekKey].revenue += student.sessionPrice
      weeks[weekKey].profit += student.sessionIncome || (student.sessionPrice - student.venueFee)
      weeks[weekKey].sessions += 1
    })
    
    return Object.values(weeks).slice(-8)
  }, [sessions, getStudent])

  // Student source distribution
  const sourceData = useMemo(() => {
    const sourceCounts: Record<string, number> = {
      social_media: 0,
      referral: 0,
      friend: 0,
      other: 0,
    }
    
    students.forEach(student => {
      const source = student.source || 'other'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })
    
    return Object.entries(sourceCounts)
      .filter(([, count]) => count > 0)
      .map(([source, count]) => ({
        name: sourceLabels[source] || source,
        value: count,
        source,
      }))
  }, [students])

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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">情况总览</h2>
        <p className="text-sm text-muted-foreground">姜贝果教练私教课情况</p>
      </div>

      {/* 本周数据 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            本周数据
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="text-center p-2 md:p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">上课人数</div>
              <div className="text-lg md:text-xl font-bold text-foreground">{weekStats.studentCount}</div>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">课时进度</div>
              <div className="text-lg md:text-xl font-bold text-foreground">
                {weekStats.completedCount}/{weekStats.totalScheduled}
              </div>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">本周利润</div>
              <div className="text-lg md:text-xl font-bold text-success">¥{weekStats.profit.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 本月数据 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            本月数据
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="text-center p-2 md:p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">上课人数</div>
              <div className="text-lg md:text-xl font-bold text-foreground">{monthStats.studentCount}</div>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">已完成课时</div>
              <div className="text-lg md:text-xl font-bold text-foreground">{monthStats.completedCount}</div>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">本月利润</div>
              <div className="text-lg md:text-xl font-bold text-success">¥{monthStats.profit.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
            <CardTitle className="text-sm md:text-base text-foreground">收入趋势</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="week" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="收入"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    name="利润"
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
            <CardTitle className="text-sm md:text-base text-foreground">学员来源分布</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {sourceData.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                    >
                      {sourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value} 人`, '学员数']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                暂无学员
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Source Table */}
      <Card className="bg-card border-border">
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
          <CardTitle className="text-sm md:text-base text-foreground">学员来源统计</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <table className="w-full min-w-[300px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-muted-foreground">来源</th>
                  <th className="px-2 md:px-4 py-2 text-center text-xs font-medium text-muted-foreground">人数</th>
                  <th className="px-2 md:px-4 py-2 text-center text-xs font-medium text-muted-foreground">占比</th>
                  <th className="px-2 md:px-4 py-2 text-right text-xs font-medium text-muted-foreground">课程收费</th>
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
                      <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-foreground">{sourceLabels[source]}</td>
                      <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-center text-foreground">{count}</td>
                      <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-center text-foreground">{percentage}%</td>
                      <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-right text-primary font-medium">¥{totalFee.toLocaleString()}</td>
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
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
          <CardTitle className="text-sm md:text-base text-foreground">学员进度</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          {studentProgressData.length > 0 ? (
            <div className="space-y-3">
              {studentProgressData.map((student, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-foreground">{student.name}</span>
                    <span className="text-muted-foreground">
                      {student.completed} / {student.completed + student.remaining}
                    </span>
                  </div>
                  <Progress value={student.progress} className="h-1.5 md:h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
              暂无学员
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
