'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StudentForm } from './student-form'
import { RenewalForm } from './renewal-form'
import { Plus, Edit2, Trash2, User, RefreshCw, FileText, AlertCircle, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Student, Session } from '@/lib/types'

interface StudentsViewProps {
  students: Student[]
  sessions: Session[]
  onAddStudent: (student: Omit<Student, 'id' | 'completedSessions' | 'createdAt' | 'renewalHistory'>) => void
  onUpdateStudent: (id: string, updates: Partial<Student>) => void
  onDeleteStudent: (id: string) => void
  onRenewStudent: (id: string, addedSessions: number, addedFee: number) => void
}

const courseTypeLabels: Record<string, string> = {
  online: '线上',
  offline: '线下',
}

const courseTypeColors: Record<string, string> = {
  online: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  offline: 'bg-primary/20 text-primary border-primary/30',
}

const sourceLabels: Record<string, string> = {
  social_media: '社媒',
  referral: '转介绍',
  friend: '朋友',
  other: '其他',
}

export function StudentsView({ 
  students, 
  sessions,
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent,
  onRenewStudent,
}: StudentsViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isRenewalOpen, setIsRenewalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | undefined>()
  const [renewingStudent, setRenewingStudent] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsFormOpen(true)
  }

  const handleRenewal = (student: Student) => {
    setRenewingStudent(student)
    setIsRenewalOpen(true)
  }

  const handleSubmit = (data: Omit<Student, 'id' | 'completedSessions' | 'createdAt' | 'renewalHistory'>) => {
    if (editingStudent) {
      onUpdateStudent(editingStudent.id, data)
    } else {
      onAddStudent(data)
    }
    setEditingStudent(undefined)
  }

  const getStudentStats = (student: Student) => {
    const studentSessions = sessions.filter(s => s.studentId === student.id)
    const completedSessions = studentSessions.filter(s => s.status === 'completed').length
    const remainingSessions = student.totalSessions - completedSessions
    const progress = student.totalSessions > 0 ? (completedSessions / student.totalSessions) * 100 : 0
    const revenue = completedSessions * student.sessionPrice
    const profit = completedSessions * (student.sessionIncome || (student.sessionPrice - student.venueFee))
    const isNearCompletion = remainingSessions <= 5 && remainingSessions > 0
    
    return { completedSessions, remainingSessions, progress, revenue, profit, isNearCompletion }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">学员管理</h2>
          <p className="text-sm text-muted-foreground">管理您的所有学员信息</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setIsFormOpen(true)} size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">添加学员</span>
            <span className="sm:hidden">添加</span>
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">暂无学员，点击上方按钮添加</p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        // 列表视图
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">学员</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">类型</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">来源</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">课时</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">单价</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">利润</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const stats = getStudentStats(student)
                    const courseType = student.courseType || 'offline'
                    return (
                      <tr key={student.id} className={cn(
                        "border-b border-border last:border-b-0 hover:bg-muted/30",
                        stats.isNearCompletion && "bg-warning/5"
                      )}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {stats.isNearCompletion && (
                              <AlertCircle className="w-3 h-3 text-warning flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-foreground">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={cn("text-xs border", courseTypeColors[courseType])} variant="secondary">
                            {courseTypeLabels[courseType]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-xs text-muted-foreground">{sourceLabels[student.source] || '其他'}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-xs text-foreground">{stats.completedSessions}/{student.totalSessions}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-xs text-foreground">¥{student.sessionPrice?.toFixed(0) || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-xs font-medium text-success">¥{stats.profit.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEdit(student)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRenewal(student)}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => onDeleteStudent(student.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // 卡片视图
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map(student => {
            const stats = getStudentStats(student)
            const courseType = student.courseType || 'offline'
            return (
              <Card key={student.id} className={cn(
                "bg-card border-border transition-shadow hover:shadow-md",
                stats.isNearCompletion && "border-warning/50"
              )}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        {stats.isNearCompletion && (
                          <AlertCircle className="w-3 h-3 text-warning flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground truncate">{student.name}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <Badge className={cn("text-xs border px-1 py-0", courseTypeColors[courseType])} variant="secondary">
                          {courseTypeLabels[courseType]}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground px-1 py-0">
                          {sourceLabels[student.source] || '其他'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEdit(student)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteStudent(student.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">课时</span>
                        <span className="text-foreground">{stats.completedSessions}/{student.totalSessions}</span>
                      </div>
                      <Progress value={stats.progress} className="h-1" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">单价: </span>
                        <span className="text-foreground">¥{student.sessionPrice?.toFixed(0) || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">利润: </span>
                        <span className="text-success font-medium">¥{stats.profit.toLocaleString()}</span>
                      </div>
                    </div>

                    {(student.trainingPlanPdf || student.contractPdf) && (
                      <div className="flex gap-2 pt-1 border-t border-border">
                        {student.trainingPlanPdf && (
                          <a href={student.trainingPlanPdf} className="flex items-center gap-0.5 text-xs text-primary hover:underline">
                            <FileText className="w-3 h-3" />
                            计划
                          </a>
                        )}
                        {student.contractPdf && (
                          <a href={student.contractPdf} className="flex items-center gap-0.5 text-xs text-primary hover:underline">
                            <FileText className="w-3 h-3" />
                            合同
                          </a>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs gap-1"
                      onClick={() => handleRenewal(student)}
                    >
                      <RefreshCw className="w-3 h-3" />
                      续课
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <StudentForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingStudent(undefined)
        }}
        onSubmit={handleSubmit}
        initialData={editingStudent}
      />

      <RenewalForm
        open={isRenewalOpen}
        onOpenChange={(open) => {
          setIsRenewalOpen(open)
          if (!open) setRenewingStudent(null)
        }}
        student={renewingStudent}
        sessions={sessions}
        onRenew={onRenewStudent}
      />
    </div>
  )
}
