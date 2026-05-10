'use client'

import { useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { StudentForm } from './student-form'
import { RenewalForm } from './renewal-form'
import { Plus, Edit2, Trash2, User, RefreshCw, FileText, AlertCircle, LayoutGrid, List, CheckCircle, Star, ChevronDown, ChevronRight, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStudentProgress, formatProfit, calculateCompositeScore } from '@/lib/utils-helper'
import type { Student, Session } from '@/lib/types'

interface StudentsViewProps {
  students: Student[]
  sessions: Session[]
  onAddStudent: (student: Omit<Student, 'id' | 'completedSessions' | 'createdAt' | 'renewalHistory'>) => void
  onUpdateStudent: (id: string, updates: Partial<Student>) => void
  onDeleteStudent: (id: string) => void
  onRenewStudent: (id: string, addedSessions: number, addedFee: number, addedVenueFee: number) => void
  onConfirmRenewal: (studentId: string, renewalId: string) => void
  onDeleteRenewal: (studentId: string, renewalId: string) => void
  onSelectStudent?: (student: Student) => void
  onRestartCourse?: (studentId: string, addedSessions: number, addedFee: number, addedVenueFee: number) => void
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
  onConfirmRenewal,
  onDeleteRenewal,
  onSelectStudent,
  onRestartCourse,
}: StudentsViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isRenewalOpen, setIsRenewalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | undefined>()
  const [renewingStudent, setRenewingStudent] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [showEndedList, setShowEndedList] = useState(false)
  const [showPausedList, setShowPausedList] = useState(false)
  const [restartingStudent, setRestartingStudent] = useState<Student | null>(null)
  const [restartForm, setRestartForm] = useState({ sessions: '', fee: '', venueFee: '' })

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
    const sessionProfit = student.sessionIncome || (student.sessionPrice - student.venueFee)
    const profit = completedSessions * sessionProfit
    const showRenewal = remainingSessions <= 4 && remainingSessions >= 0
    
    // Get progress info with dynamic color
    const progressInfo = getStudentProgress(student)
    
    // Pending (unconfirmed) renewals
    const pendingRenewals = (student.renewalHistory || []).filter(r => !r.confirmed)
    // Confirmed renewals
    const confirmedRenewals = (student.renewalHistory || []).filter(r => r.confirmed)
    
    // Five-dimension rating
    const compositeScore = calculateCompositeScore(student.ratings)
    
    return { 
      completedSessions, 
      remainingSessions, 
      progress, 
      profit, 
      showRenewal, 
      sessionProfit, 
      pendingRenewals, 
      confirmedRenewals,
      progressColor: progressInfo.color,
      compositeScore,
    }
  }

  // 分类学员
  const activeStudents = students.filter(s => s.status !== 'ended' && s.status !== 'paused')
  const pausedStudents = students.filter(s => s.status === 'paused')
  const endedStudents = students.filter(s => s.status === 'ended')

  const handleRestartSubmit = () => {
    if (!restartingStudent || !onRestartCourse) return
    const addedSessions = parseInt(restartForm.sessions) || 0
    const addedFee = parseFloat(restartForm.fee) || 0
    const addedVenueFee = parseFloat(restartForm.venueFee) || 0
    if (addedSessions > 0 && addedFee > 0) {
      onRestartCourse(restartingStudent.id, addedSessions, addedFee, addedVenueFee)
      setRestartingStudent(null)
      setRestartForm({ sessions: '', fee: '', venueFee: '' })
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">学员管理</h2>
          <p className="text-sm text-muted-foreground">管理您的所有学员信息</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg p-0.5">
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

      {activeStudents.length === 0 && pausedStudents.length === 0 && endedStudents.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">暂无学员，点击上方按钮添加</p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">学员</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">类型</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">来源</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">课时</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">进度</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">评分</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">利润</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudents.map(student => {
                    const stats = getStudentStats(student)
                    const courseType = student.courseType || 'offline'
                    return (
                      <Fragment key={student.id}>
                        <tr 
                          className={cn(
                            "border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors",
                            stats.showRenewal && "bg-warning/5"
                          )}
                          onClick={() => onSelectStudent?.(student)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {stats.showRenewal && (
                                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                              )}
                              <span className="text-base font-medium text-foreground">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={cn("text-sm border", courseTypeColors[courseType])} variant="secondary">
                              {courseTypeLabels[courseType]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-muted-foreground">{sourceLabels[student.source] || '其他'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-foreground">{stats.completedSessions}/{student.totalSessions}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-20">
                                <div 
                                  className={cn(
                                    "h-full transition-all",
                                    stats.progressColor === 'success' && "bg-success",
                                    stats.progressColor === 'warning' && "bg-warning",
                                    stats.progressColor === 'destructive' && "bg-destructive"
                                  )}
                                  style={{ width: `${Math.min(stats.progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground min-w-6 text-right">{stats.remainingSessions}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {stats.compositeScore > 0 && (
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-medium">{stats.compositeScore.toFixed(1)}</span>
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-success">¥{formatProfit(stats.profit)}</span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEdit(student)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              {stats.showRenewal && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6 text-warning"
                                  onClick={() => handleRenewal(student)}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              )}
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
                        {/* Confirmed renewal records */}
                        {stats.confirmedRenewals.map(renewal => (
                          <tr key={renewal.id} className="border-b border-border bg-success/5">
                            <td colSpan={8} className="px-3 py-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                                  <span className="text-xs text-success">
                                    已确认续课：+{renewal.addedSessions}节 / ¥{renewal.addedFee.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(renewal.date).toLocaleDateString('zh-CN')}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                    onClick={() => onDeleteRenewal(student.id, renewal.id)}
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Pending renewal confirmations */}
                        {stats.pendingRenewals.map(renewal => (
                          <tr key={renewal.id} className="border-b border-border bg-warning/5">
                            <td colSpan={8} className="px-3 py-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`confirm-${renewal.id}`}
                                    checked={false}
                                    onCheckedChange={() => onConfirmRenewal(student.id, renewal.id)}
                                    className="h-3.5 w-3.5"
                                  />
                                  <label htmlFor={`confirm-${renewal.id}`} className="text-xs text-warning cursor-pointer">
                                    待确认续课：+{renewal.addedSessions}节 / ¥{renewal.addedFee.toLocaleString()}
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(renewal.date).toLocaleDateString('zh-CN')}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                    onClick={() => onDeleteRenewal(student.id, renewal.id)}
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeStudents.map(student => {
            const stats = getStudentStats(student)
            const courseType = student.courseType || 'offline'
            return (
              <Card 
                key={student.id} 
                className={cn(
                  "bg-card border-border transition-shadow hover:shadow-md cursor-pointer",
                  stats.showRenewal && "border-warning/50"
                )}
                onClick={() => onSelectStudent?.(student)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        {stats.showRenewal && (
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
                        <span className="text-muted-foreground">单节利润: </span>
                        <span className="text-foreground">¥{stats.sessionProfit.toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">累计: </span>
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

                    {/* Confirmed renewals */}
                    {stats.confirmedRenewals.map(renewal => (
                      <div key={renewal.id} className="flex items-center gap-2 p-1.5 bg-success/10 rounded text-xs">
                        <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                        <span className="text-success flex-1">
                          已确认 +{renewal.addedSessions}节
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteRenewal(student.id, renewal.id)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ))}
                    {/* Pending renewals */}
                    {stats.pendingRenewals.map(renewal => (
                      <div key={renewal.id} className="flex items-center gap-2 p-1.5 bg-warning/10 rounded text-xs">
                        <Checkbox
                          id={`card-confirm-${renewal.id}`}
                          checked={false}
                          onCheckedChange={() => onConfirmRenewal(student.id, renewal.id)}
                          className="h-3 w-3"
                        />
                        <label htmlFor={`card-confirm-${renewal.id}`} className="text-warning cursor-pointer flex-1">
                          待确认 +{renewal.addedSessions}节
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteRenewal(student.id, renewal.id)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ))}

                    {stats.showRenewal && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs gap-1 border-warning/50 text-warning hover:bg-warning/10"
                        onClick={() => handleRenewal(student)}
                      >
                        <RefreshCw className="w-3 h-3" />
                        续课计划
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 暂停课程学员列表 */}
      {pausedStudents.length > 0 && (
        <Card className="bg-card border-border border-primary/30">
          <CardContent className="p-0">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
              onClick={() => setShowPausedList(!showPausedList)}
            >
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">暂停课程学员</span>
                <span className="text-sm text-primary">({pausedStudents.length})</span>
              </div>
              {showPausedList ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-primary" />}
            </button>
            {showPausedList && (
              <div className="border-t border-border p-3 space-y-2">
                {pausedStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{student.name}</span>
                      {student.pausedAt && (
                        <span className="text-xs text-muted-foreground">
                          暂停于 {new Date(student.pausedAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onUpdateStudent(student.id, { status: 'active', pausedAt: undefined })}
                    >
                      恢复课程
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 已结课学员列表 */}
      {endedStudents.length > 0 && (
        <Card className="bg-card border-border border-foreground/30">
          <CardContent className="p-0">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              onClick={() => setShowEndedList(!showEndedList)}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-foreground" />
                <span className="font-medium text-foreground">已结课学员</span>
                <span className="text-sm text-foreground">({endedStudents.length})</span>
              </div>
              {showEndedList ? <ChevronDown className="w-4 h-4 text-foreground" /> : <ChevronRight className="w-4 h-4 text-foreground" />}
            </button>
            {showEndedList && (
              <div className="border-t border-border p-3 space-y-2">
                {endedStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{student.name}</span>
                      {student.endedAt && (
                        <span className="text-xs text-muted-foreground">
                          结课于 {new Date(student.endedAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setRestartingStudent(student)}
                    >
                      <Play className="w-3 h-3" />
                      重启课程
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 重启课程弹窗 */}
      {restartingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">重启课程 - {restartingStudent.name}</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">新增课时数</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="输入课时数"
                    value={restartForm.sessions}
                    onChange={(e) => setRestartForm(prev => ({ ...prev, sessions: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">课程费用 (¥)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="输入总费用"
                    value={restartForm.fee}
                    onChange={(e) => setRestartForm(prev => ({ ...prev, fee: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">场地费/节 (¥)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="输入场地费"
                    value={restartForm.venueFee}
                    onChange={(e) => setRestartForm(prev => ({ ...prev, venueFee: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setRestartingStudent(null)
                  setRestartForm({ sessions: '', fee: '', venueFee: '' })
                }}>
                  取消
                </Button>
                <Button onClick={handleRestartSubmit}>
                  确认重启
                </Button>
              </div>
            </CardContent>
          </Card>
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
