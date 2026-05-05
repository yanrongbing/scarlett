'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Bell, AlertCircle, CheckCircle, Wallet, User, RefreshCw, Star, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Student, Session } from '@/lib/types'

interface RiskViewProps {
  students: Student[]
  sessions: Session[]
  getStudent: (id: string) => Student | undefined
  onRenewStudent?: (student: Student) => void
}

interface RiskStudent {
  student: Student
  completed: number
  remaining: number
  remainingPercent: number
  refundReserve: number
  riskLevel: 'high' | 'medium' | 'low'
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

export function RiskView({ students, sessions, getStudent, onRenewStudent }: RiskViewProps) {
  // 近两周重点学员（按上课次数排序）
  const topStudents = useMemo(() => {
    const now = new Date()
    const thisWeek = getWeekRange(now, 0)
    const lastWeek = getWeekRange(now, 1)
    
    const startStr = lastWeek.start.toISOString().split('T')[0]
    const endStr = thisWeek.end.toISOString().split('T')[0]
    
    // 获取近两周所有课程
    const twoWeekSessions = sessions.filter(s => {
      return s.date >= startStr && s.date <= endStr
    })
    
    // 统计每个学员的上课次数
    const studentSessionCounts: Record<string, number> = {}
    twoWeekSessions.forEach(s => {
      studentSessionCounts[s.studentId] = (studentSessionCounts[s.studentId] || 0) + 1
    })
    
    // 排序并返回
    return Object.entries(studentSessionCounts)
      .map(([studentId, count]) => {
        const student = getStudent(studentId)
        return { student, count }
      })
      .filter(item => item.student)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [sessions, getStudent])

  // 近期静默学员（近2周未排课）
  const silentStudents = useMemo(() => {
    const now = new Date()
    const twoWeeksAgo = getWeekRange(now, 1)
    const startStr = twoWeeksAgo.start.toISOString().split('T')[0]
    const endStr = now.toISOString().split('T')[0]
    
    // 获取近两周有排课的学员ID
    const activeStudentIds = new Set(
      sessions
        .filter(s => s.date >= startStr && s.date <= endStr)
        .map(s => s.studentId)
    )
    
    // 返回没有排课的学员
    return students.filter(s => !activeStudentIds.has(s.id))
  }, [students, sessions])

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

  const highRiskCount = riskAnalysis.filter(r => r.riskLevel === 'high').length
  const nearCompletionCount = riskAnalysis.filter(r => r.remaining <= 5 && r.remaining > 0).length

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <Bell className="w-3 h-3 text-destructive" />
      case 'medium':
        return <AlertCircle className="w-3 h-3 text-warning" />
      default:
        return <CheckCircle className="w-3 h-3 text-success" />
    }
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive" className="text-xs px-1.5 py-0">需关注</Badge>
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground text-xs px-1.5 py-0">注意</Badge>
      default:
        return <Badge className="bg-success text-success-foreground text-xs px-1.5 py-0">正常</Badge>
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">重要提醒</h2>
        <p className="text-sm text-muted-foreground">监控学员课时消耗情况和续课提醒</p>
      </div>

      {/* Summary Cards - 3 columns on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">需关注</span>
              <Bell className="w-3 h-3 text-destructive" />
            </div>
            <div className="text-lg md:text-2xl font-bold text-destructive">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground hidden md:block">剩余 {'>'}60%</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">建议续课</span>
              <RefreshCw className="w-3 h-3 text-warning" />
            </div>
            <div className="text-lg md:text-2xl font-bold text-warning">{nearCompletionCount}</div>
            <p className="text-xs text-muted-foreground hidden md:block">剩余{'<'}5节</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">预留退费</span>
              <Wallet className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="text-lg md:text-2xl font-bold text-foreground">¥{Math.round(totalRefundReserve / 1000)}k</div>
            <p className="text-xs text-muted-foreground hidden md:block">剩余×30%</p>
          </CardContent>
        </Card>
      </div>

      {/* 近两周重点学员 */}
      <Card className="bg-card border-border">
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
          <CardTitle className="text-sm md:text-base flex items-center gap-2 text-foreground">
            <Star className="w-4 h-4 text-primary" />
            近两周重点学员
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          {topStudents.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {topStudents.map(({ student, count }) => (
                <div 
                  key={student!.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{student!.name}</p>
                    <p className="text-xs text-muted-foreground">{count}次</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">近两周暂无上课记录</p>
          )}
        </CardContent>
      </Card>

      {/* 近期静默学员 */}
      {silentStudents.length > 0 && (
        <Card className="bg-card border-border border-destructive/50">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
            <CardTitle className="text-sm md:text-base flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-destructive" />
              近期静默学员
              <Badge variant="destructive" className="text-xs">重点关注</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {silentStudents.map(student => (
                <div 
                  key={student.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30"
                >
                  <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-destructive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-destructive">2周未排课</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 续课提醒 */}
      {nearCompletionCount > 0 && (
        <Card className="bg-card border-border border-warning/50">
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
            <CardTitle className="text-sm md:text-base flex items-center gap-2 text-foreground">
              <RefreshCw className="w-4 h-4 text-warning" />
              续课提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="space-y-2">
              {riskAnalysis
                .filter(r => r.remaining <= 5 && r.remaining > 0)
                .map(({ student, completed, remaining }) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-warning/10 border border-warning/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-warning" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          剩{remaining}节/已完成{completed}节
                        </p>
                      </div>
                    </div>
                    {onRenewStudent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs gap-1 px-2"
                        onClick={() => onRenewStudent(student)}
                      >
                        <RefreshCw className="w-3 h-3" />
                        续课
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
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2">
          <CardTitle className="text-sm md:text-base text-foreground">学员课时详情</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          {riskAnalysis.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无学员数据</p>
            </div>
          ) : (
            <div className="space-y-2">
              {riskAnalysis.map(({ student, completed, remaining, remainingPercent, refundReserve, riskLevel, isNew }) => (
                <div 
                  key={student.id} 
                  className={cn(
                    "p-2 md:p-3 rounded-lg border",
                    isNew && "border-chart-2/30 bg-chart-2/5",
                    !isNew && riskLevel === 'high' && "border-destructive/30 bg-destructive/5",
                    !isNew && riskLevel === 'medium' && "border-warning/30 bg-warning/5",
                    !isNew && riskLevel === 'low' && "border-border bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isNew ? (
                        <FileText className="w-3 h-3 text-chart-2" />
                      ) : (
                        getRiskIcon(riskLevel)
                      )}
                      <span className="text-xs md:text-sm font-medium text-foreground">{student.name}</span>
                      <span className="text-xs text-muted-foreground">¥{student.sessionPrice.toFixed(0)}/节</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-1 text-xs text-chart-2 mb-2">
                      <FileText className="w-3 h-3" />
                      <span>请添加训练计划</span>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">课时</span>
                      <span className="text-foreground">{completed}/{student.totalSessions} (剩{remaining})</span>
                    </div>
                    <Progress 
                      value={100 - remainingPercent} 
                      className={cn(
                        "h-1.5",
                        !isNew && riskLevel === 'high' && "[&>div]:bg-destructive",
                        !isNew && riskLevel === 'medium' && "[&>div]:bg-warning",
                        isNew && "[&>div]:bg-chart-2"
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-muted-foreground">剩余 {remainingPercent.toFixed(0)}%</span>
                    <span className="text-muted-foreground">预留退费 ¥{refundReserve.toLocaleString()}</span>
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
