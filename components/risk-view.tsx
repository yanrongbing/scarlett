'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Wallet, User, RefreshCw, Star, Clock, FileText, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Student, Session } from '@/lib/types'
import { calculateCompositeScore } from '@/lib/utils-helper'

interface RiskViewProps {
  students: Student[]
  sessions: Session[]
  getStudent: (id: string) => Student | undefined
  onRenewStudent?: (student: Student) => void
  onSelectStudent?: (student: Student) => void
  onEndCourse?: (studentId: string) => void
  onPauseCourse?: (studentId: string) => void
}

interface RiskStudent {
  student: Student
  completed: number
  remaining: number
  remainingPercent: number
  refundReserve: number
  riskLevel: 'high' | 'medium' | 'low'
  isNew: boolean
}

function getWeekRange(date: Date, weeksAgo: number = 0) {
  const d = new Date(date)
  d.setDate(d.getDate() - weeksAgo * 7)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { start: monday, end: sunday }
}

export function RiskView({ students, sessions, getStudent, onRenewStudent, onSelectStudent, onEndCourse, onPauseCourse }: RiskViewProps) {
  // 近1周新增学员
  const newStudentsThisWeek = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0]
    
    return students.filter(s => {
      if (!s.createdAt) return false
      const createdDate = new Date(s.createdAt).toISOString().split('T')[0]
      return createdDate >= oneWeekAgoStr
    })
  }, [students])

  // 续课提醒（剩余课时 <= 4，排除已结课、已有续课计划的学员）
  const renewalReminders = useMemo(() => {
    return students.map(student => {
      const completed = sessions.filter(
        s => s.studentId === student.id && s.status === 'completed'
      ).length
      const remaining = student.totalSessions - completed
      // 检查是否有待确认的续课计划
      const hasPendingRenewal = (student.renewalHistory || []).some(r => !r.confirmed)
      return { student, completed, remaining, hasPendingRenewal }
    }).filter(item => {
      // 排除已结课学员
      if (item.student.status === 'ended') return false
      // 排除已有续课计划的学员
      if (item.hasPendingRenewal) return false
      // 只显示剩余课时 <= 4 的学员
      return item.remaining <= 4 && item.remaining >= 0
    })
      .sort((a, b) => a.remaining - b.remaining)
  }, [students, sessions])

  // 近两周重点学员（上一周和本周，以自然周为基准）
  const topStudents = useMemo(() => {
    const now = new Date()
    const thisWeek = getWeekRange(now, 0)
    const lastWeek = getWeekRange(now, 1)
    
    const startStr = lastWeek.start.toISOString().split('T')[0]
    const endStr = thisWeek.end.toISOString().split('T')[0]
    
    // 统计上一周和本周的课程
    const twoWeekSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr)
    
    const studentSessionCounts: Record<string, number> = {}
    twoWeekSessions.forEach(s => {
      studentSessionCounts[s.studentId] = (studentSessionCounts[s.studentId] || 0) + 1
    })
    
    return Object.entries(studentSessionCounts)
      .map(([studentId, count]) => {
        const student = getStudent(studentId)
        return { student, count }
      })
      .filter(item => item.student && item.count > 4) // 只展示超过4节的学员
      .sort((a, b) => b.count - a.count)
  }, [sessions, getStudent])

  // 近期静默学员（从今天起倒推20天内，未排课且未结课的学员）
  const silentStudents = useMemo(() => {
    const now = new Date()
    const twentyDaysAgo = new Date(now)
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20)
    
    const startStr = twentyDaysAgo.toISOString().split('T')[0]
    const endStr = now.toISOString().split('T')[0]
    
    const activeStudentIds = new Set(
      sessions
        .filter(s => s.date >= startStr && s.date <= endStr)
        .map(s => s.studentId)
    )
    
    return students.filter(s => {
      // 排除已结课学员
      if (s.status === 'ended') return false
      // 排除已暂停且在30天内的学员
      if (s.status === 'paused' && s.pausedAt) {
        const pausedDate = new Date(s.pausedAt)
        const daysSincePaused = (now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSincePaused < 30) return false
      }
      return !activeStudentIds.has(s.id)
    })
  }, [students, sessions])

  // 课时分析
  const riskAnalysis = useMemo(() => {
    const newStudentIds = new Set(newStudentsThisWeek.map(s => s.id))
    
    const analysis: RiskStudent[] = students.map(student => {
      const completed = sessions.filter(
        s => s.studentId === student.id && s.status === 'completed'
      ).length
      const remaining = student.totalSessions - completed
      const remainingPercent = student.totalSessions > 0 
        ? (remaining / student.totalSessions) * 100 
        : 0
      
      const refundReserve = remaining * student.sessionPrice * 0.3
      
      let riskLevel: 'high' | 'medium' | 'low' = 'low'
      if (remainingPercent > 60) {
        riskLevel = 'high'
      } else if (remainingPercent > 40) {
        riskLevel = 'medium'
      }
      
      return {
        student,
        completed,
        remaining,
        remainingPercent,
        refundReserve,
        riskLevel,
        isNew: newStudentIds.has(student.id),
      }
    })
    
    return analysis.sort((a, b) => b.remainingPercent - a.remainingPercent)
  }, [students, sessions, newStudentsThisWeek])

  const totalRefundReserve = useMemo(() => {
    return riskAnalysis.reduce((sum, r) => sum + r.refundReserve, 0)
  }, [riskAnalysis])

  // 剩余课时场地费：所有未结课学员（正在上课和暂停课程）剩余应支付的场地费
  const totalRemainingVenueFee = useMemo(() => {
    return students
      .filter(s => s.status !== 'ended') // 排除已结课学员
      .reduce((sum, student) => {
        const completed = sessions.filter(
          s => s.studentId === student.id && s.status === 'completed'
        ).length
        const remaining = student.totalSessions - completed
        const venueFee = student.venueFee || 0
        return sum + (remaining * venueFee)
      }, 0)
  }, [students, sessions])

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertCircle className="w-3 h-3 text-destructive" />
      case 'medium':
        return <AlertCircle className="w-3 h-3 text-warning" />
      default:
        return <CheckCircle className="w-3 h-3 text-success" />
    }
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive" className="text-sm font-semibold px-2 py-0.5">需关注</Badge>
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground text-sm font-semibold px-2 py-0.5">注意</Badge>
      default:
        return <Badge className="bg-success text-success-foreground text-xs px-1.5 py-0">正��</Badge>
    }
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">重要提醒</h2>
        <p className="text-sm text-muted-foreground">监控学员课时消耗与续课提醒</p>
      </div>

      {/* Summary Cards - 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-card border-border border-destructive/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs md:text-sm text-muted-foreground font-medium">需关注</span>
              <VolumeX className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-destructive">{silentStudents.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">静默学员</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border border-warning/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs md:text-sm text-muted-foreground font-medium">建议续课</span>
              <RefreshCw className="w-4 h-4 text-warning" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-warning">{renewalReminders.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">待处理</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs md:text-sm text-muted-foreground font-medium">预留退费</span>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-foreground">¥{Math.round(totalRefundReserve).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">建议预留</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-primary/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs md:text-sm text-muted-foreground font-medium">剩余场地费</span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-primary">¥{Math.round(totalRemainingVenueFee).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">待支付</p>
          </CardContent>
        </Card>
      </div>

      {/* 续课提醒 - moved before 近两周重点学员 */}
      {renewalReminders.length > 0 && (
        <Card className="bg-card border-border border-warning/50">
          <CardHeader className="px-3 py-2 md:px-4 md:py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <RefreshCw className="w-4 h-4 text-warning" />
              续课提醒
              <Badge className="bg-warning/20 text-warning border-warning/30 text-sm font-semibold">{renewalReminders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-4 md:pb-4 pt-0">
            <div className="space-y-1.5">
              {renewalReminders.map(({ student, completed, remaining }) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/20"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-2.5 h-2.5 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">剩{remaining}节/已完成{completed}节</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onRenewStudent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs gap-1 px-2 border-warning/50 text-warning hover:bg-warning/10"
                        onClick={() => onRenewStudent(student)}
                      >
                        <RefreshCw className="w-3 h-3" />
                        续课
                      </Button>
                    )}
                    {onPauseCourse && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs gap-1 px-2 border-primary/50 text-primary hover:bg-primary/10"
                        onClick={() => onPauseCourse(student.id)}
                      >
                        <Clock className="w-3 h-3" />
                        暂停
                      </Button>
                    )}
                    {onEndCourse && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs gap-1 px-2 border-muted-foreground/50 text-muted-foreground hover:bg-muted/50"
                        onClick={() => onEndCourse(student.id)}
                      >
                        <CheckCircle className="w-3 h-3" />
                        结课
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 近两周重点学员 */}
      <Card className="bg-card border-border">
        <CardHeader className="px-3 py-2 md:px-4 md:py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground">
            <Star className="w-4 h-4 text-primary" />
            近两周重点学员
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-4 md:pb-4 pt-0">
          {topStudents.length > 0 ? (
            <div className="space-y-2">
              {topStudents.map(({ student, count }) => {
                const compositeScore = calculateCompositeScore(student!.ratings)
                return (
                  <div 
                    key={student!.id}
                    className="p-3 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => onSelectStudent?.(student!)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-base font-bold text-foreground">{student!.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {count}节课
                        </Badge>
                        {compositeScore > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold">{compositeScore.toFixed(1)}</span>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    {student!.trainingBackground && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-10">
                        <span className="font-medium text-foreground">训练计划：</span>
                        {student!.trainingBackground}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">近两周暂无上课记录</p>
          )}
        </CardContent>
      </Card>

      {/* 近期静默学员 */}
      {silentStudents.length > 0 && (
        <Card className="bg-card border-border border-destructive/50">
          <CardHeader className="px-3 py-2 md:px-4 md:py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <VolumeX className="w-4 h-4 text-destructive" />
              近期静默学员
              <Badge variant="destructive" className="text-sm font-semibold px-2">重点关注</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-4 md:pb-4 pt-0">
            <div className="space-y-1.5">
              {silentStudents.map(student => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-2 rounded bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-2.5 h-2.5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-destructive">20天内未排课</p>
                    </div>
                  </div>
                  {onPauseCourse && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs gap-1 px-2 border-destructive/50 text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => onPauseCourse(student.id)}
                    >
                      <Clock className="w-3 h-3" />
                      暂停课程
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 学员课时详情 */}
      <Card className="bg-card border-border">
        <CardHeader className="px-3 py-2 md:px-4 md:py-3">
          <CardTitle className="text-sm text-foreground">学员课时详情</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-4 md:pb-4 pt-0">
          {riskAnalysis.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <User className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">暂无学员数据</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {riskAnalysis.map(({ student, completed, remaining, remainingPercent, refundReserve, riskLevel, isNew }) => (
                <div 
                  key={student.id} 
                  className={cn(
                    "p-2 rounded border",
                    isNew && "border-chart-2/30 bg-chart-2/5",
                    !isNew && riskLevel === 'high' && "border-destructive/30 bg-destructive/5",
                    !isNew && riskLevel === 'medium' && "border-warning/30 bg-warning/5",
                    !isNew && riskLevel === 'low' && "border-border bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isNew ? (
                        <FileText className="w-3 h-3 text-chart-2" />
                      ) : (
                        getRiskIcon(riskLevel)
                      )}
                      <span className="text-xs font-medium text-foreground">{student.name}</span>
                      <span className="text-xs text-muted-foreground">¥{student.sessionPrice.toFixed(0)}/节</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isNew ? (
                        <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30 text-xs px-1.5 py-0">
                          新学员
                        </Badge>
                      ) : (
                        getRiskBadge(riskLevel)
                      )}
                    </div>
                  </div>
                  
                  {isNew && !student.trainingBackground && (
                    <div className="flex items-center gap-1 text-xs text-chart-2 mb-1.5">
                      <FileText className="w-3 h-3" />
                      <span>建议添加训练计划</span>
                    </div>
                  )}
                  
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">课时</span>
                      <span className="text-foreground">{completed}/{student.totalSessions} (剩{remaining})</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          remaining > 8 && "bg-success",
                          remaining >= 3 && remaining <= 8 && "bg-warning",
                          remaining < 3 && "bg-destructive"
                        )}
                        style={{ width: `${Math.min(100 - remainingPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">剩余 {remainingPercent.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
