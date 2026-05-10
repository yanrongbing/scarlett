'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus, X, Check, AlertCircle, Minus, Circle } from 'lucide-react'
import type { Student, Session, SessionRecord, SessionTrainingItem } from '@/lib/types'

interface SessionRecordsTabProps {
  student: Student
  sessions: Session[]
  sessionRecords: SessionRecord[]
  onUpdateSessionRecord: (record: SessionRecord) => void
}

const statusOptions = [
  { value: 'excellent', label: '出色', icon: Check, color: 'text-success' },
  { value: 'good', label: '良好', icon: Circle, color: 'text-primary' },
  { value: 'normal', label: '一般', icon: Minus, color: 'text-muted-foreground' },
  { value: 'poor', label: '较差', icon: AlertCircle, color: 'text-warning' },
  { value: 'bad', label: '糟糕', icon: X, color: 'text-destructive' },
]

const getStatusColor = (status: string) => {
  const option = statusOptions.find(o => o.value === status)
  return option?.color || 'text-muted-foreground'
}

const getStatusLabel = (status: string) => {
  const option = statusOptions.find(o => o.value === status)
  return option?.label || ''
}

export function SessionRecordsTab({ 
  student, 
  sessions,
  sessionRecords,
  onUpdateSessionRecord 
}: SessionRecordsTabProps) {
  // 计算已完成课时数
  const completedCount = useMemo(() => 
    sessions.filter(s => s.studentId === student.id && s.status === 'completed').length,
    [sessions, student.id]
  )

  const [currentLesson, setCurrentLesson] = useState(Math.min(completedCount, student.totalSessions) || 1)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // 获取当前课时的记录
  const currentRecord: SessionRecord = useMemo(() => {
    const existing = sessionRecords.find(r => r.lessonNumber === currentLesson)
    if (existing) return existing
    return {
      id: crypto.randomUUID(),
      studentId: student.id,
      lessonNumber: currentLesson,
      trainingItems: [],
      overallStatus: '',
      statusNote: '',
      coachMemo: '',
      includeMemoInPdf: false,
    }
  }, [sessionRecords, currentLesson, student.id])

  const updateRecord = (updates: Partial<SessionRecord>) => {
    onUpdateSessionRecord({
      ...currentRecord,
      ...updates,
    })
  }

  const addTrainingItem = () => {
    const newItem: SessionTrainingItem = {
      id: crypto.randomUUID(),
      name: '',
      status: 'normal',
      note: '',
    }
    updateRecord({
      trainingItems: [...currentRecord.trainingItems, newItem]
    })
    setEditingItemId(newItem.id)
  }

  const updateTrainingItem = (itemId: string, updates: Partial<SessionTrainingItem>) => {
    updateRecord({
      trainingItems: currentRecord.trainingItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    })
  }

  const deleteTrainingItem = (itemId: string) => {
    updateRecord({
      trainingItems: currentRecord.trainingItems.filter(item => item.id !== itemId)
    })
  }

  const goToPreviousLesson = () => {
    if (currentLesson > 1) setCurrentLesson(currentLesson - 1)
  }

  const goToNextLesson = () => {
    if (currentLesson < student.totalSessions) setCurrentLesson(currentLesson + 1)
  }

  // 判断当前课是否已完成
  const isLessonCompleted = currentLesson <= completedCount

  return (
    <div className="space-y-6">
      {/* 课时导航 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToPreviousLesson}
              disabled={currentLesson <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一节
            </Button>
            
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">第 {currentLesson} 节课</span>
              <Badge variant={isLessonCompleted ? 'default' : 'secondary'}>
                {isLessonCompleted ? '已完成' : '未完成'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                / 共 {student.totalSessions} 节
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToNextLesson}
              disabled={currentLesson >= student.totalSessions}
            >
              下一节
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* 快速跳转 */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">跳转到:</span>
            <Select 
              value={String(currentLesson)} 
              onValueChange={(v) => setCurrentLesson(parseInt(v))}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: student.totalSessions }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={String(num)}>
                    第 {num} 节
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 训练项目记录 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">训练项目</CardTitle>
            <Button size="sm" variant="outline" onClick={addTrainingItem}>
              <Plus className="w-4 h-4 mr-1" />
              添加项目
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentRecord.trainingItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <p>暂无训练项目记录</p>
              <p className="text-sm mt-1">点击上方按钮添加本节课的训练项目</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentRecord.trainingItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 rounded-lg bg-muted/30 space-y-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      {editingItemId === item.id ? (
                        <Input
                          placeholder="训练项目名称"
                          value={item.name}
                          onChange={(e) => updateTrainingItem(item.id, { name: e.target.value })}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="font-medium cursor-pointer hover:text-primary"
                          onClick={() => setEditingItemId(item.id)}
                        >
                          {item.name || '点击输入项目名称'}
                        </div>
                      )}
                    </div>
                    
                    <Select 
                      value={item.status} 
                      onValueChange={(v) => updateTrainingItem(item.id, { status: v })}
                    >
                      <SelectTrigger className={`w-24 h-8 ${getStatusColor(item.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className={opt.color}>{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => deleteTrainingItem(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Input
                    placeholder="备注说明 (可选)"
                    value={item.note || ''}
                    onChange={(e) => updateTrainingItem(item.id, { note: e.target.value })}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 整体状态评价 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">整体状态评价</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm">本节课整体状态:</span>
            <div className="flex gap-2">
              {statusOptions.map(opt => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={currentRecord.overallStatus === opt.value ? 'default' : 'outline'}
                  className={currentRecord.overallStatus === opt.value ? '' : opt.color}
                  onClick={() => updateRecord({ overallStatus: opt.value })}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Textarea
              placeholder="状态说明 (可选)..."
              value={currentRecord.statusNote || ''}
              onChange={(e) => updateRecord({ statusNote: e.target.value })}
              className="min-h-[60px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* 教练备忘 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">教练备忘</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeMemo"
                checked={currentRecord.includeMemoInPdf}
                onCheckedChange={(checked) => updateRecord({ includeMemoInPdf: !!checked })}
              />
              <label htmlFor="includeMemo" className="text-sm text-muted-foreground cursor-pointer">
                包含在PDF中
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="记录教练的私人备忘..."
            value={currentRecord.coachMemo || ''}
            onChange={(e) => updateRecord({ coachMemo: e.target.value })}
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
