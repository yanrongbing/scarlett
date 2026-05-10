'use client'

import { useState, useMemo, useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Clock, MapPin, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Student, Session } from '@/lib/types'

interface ScheduleViewProps {
  students: Student[]
  sessions: Session[]
  onAddSession: (session: Omit<Session, 'id' | 'createdAt'>) => void
  onUpdateSession: (id: string, updates: Partial<Session>) => void
  onDeleteSession: (id: string) => void
  getStudent: (id: string) => Student | undefined
}

// 2-hour time blocks from 8:00 to 22:00
const TIME_BLOCKS = [
  { start: 8, end: 10, label: '08:00-10:00' },
  { start: 10, end: 12, label: '10:00-12:00' },
  { start: 12, end: 14, label: '12:00-14:00' },
  { start: 14, end: 16, label: '14:00-16:00' },
  { start: 16, end: 18, label: '16:00-18:00' },
  { start: 18, end: 20, label: '18:00-20:00' },
  { start: 20, end: 22, label: '20:00-22:00' },
]

// 半小时时间选项
const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
]

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function getWeekDates(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function formatDateShort(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getTimeOptionsForBlock(startHour: number) {
  return TIME_OPTIONS.filter(t => {
    const hour = parseInt(t.split(':')[0])
    return hour >= startHour && hour < startHour + 2
  })
}

export function ScheduleView({ 
  students, 
  sessions, 
  onAddSession, 
  onUpdateSession, 
  onDeleteSession,
  getStudent 
}: ScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; blockStart: number } | null>(null)
  
  // Form state
  const [formStudentId, setFormStudentId] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const locationRef = useRef<HTMLInputElement>(null)

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  
  const weekSessions = useMemo(() => {
    const startDate = formatDate(weekDates[0])
    const endDate = formatDate(weekDates[6])
    return sessions.filter(s => s.date >= startDate && s.date <= endDate)
  }, [sessions, weekDates])

  const getSessionsForSlot = (date: string, startHour: number) => {
    return weekSessions.filter(s => {
      const sessionHour = parseInt(s.time.split(':')[0])
      return s.date === date && sessionHour >= startHour && sessionHour < startHour + 2
    })
  }

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const handleSlotClick = (date: string, startHour: number) => {
    const existingSessions = getSessionsForSlot(date, startHour)
    // 允许每个2小时时间块最多排2节课
    if (existingSessions.length < 2) {
      setSelectedSlot({ date, blockStart: startHour })
      setFormStudentId('')
      setFormTime(getTimeOptionsForBlock(startHour)[0] || '')
      setFormLocation('')
      setIsFormOpen(true)
    }
  }

  const handleToggleComplete = (session: Session) => {
    onUpdateSession(session.id, { 
      status: session.status === 'completed' ? 'planned' : 'completed' 
    })
  }

  const handleLocationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const handleAddSession = () => {
    if (!selectedSlot || !formStudentId || !formTime) return
    onAddSession({
      studentId: formStudentId,
      date: selectedSlot.date,
      time: formTime,
      location: formLocation,
      status: 'planned',
    })
    setIsFormOpen(false)
    setSelectedSlot(null)
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">训练课表</h2>
          <p className="text-sm text-muted-foreground">周视图 · 点击空格排课 · 勾选标记完成</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs md:text-sm font-medium px-2 min-w-[100px] text-center">
            {formatDateShort(weekDates[0])} - {formatDateShort(weekDates[6])}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-8 border-b border-border">
                <div className="p-2 text-xs font-medium text-muted-foreground">时间</div>
                {weekDates.map((date, i) => {
                  const isToday = formatDate(date) === formatDate(new Date())
                  const isWeekend = i >= 5 // 周六(5)、周日(6)
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-2 text-center border-l border-border",
                        isToday && "bg-primary/10",
                        isWeekend && !isToday && "bg-muted/60"
                      )}
                    >
                      <div className="text-xs font-medium text-foreground">{DAYS[i]}</div>
                      <div className="text-xs text-muted-foreground">{formatDateShort(date)}</div>
                    </div>
                  )
                })}
              </div>
              
              {/* Time blocks (2 hours each) */}
              {TIME_BLOCKS.map(block => (
                <div key={block.start} className="grid grid-cols-8 border-b border-border last:border-b-0">
                  <div className="p-2 text-xs text-muted-foreground flex items-center">
                    {block.label}
                  </div>
                  {weekDates.map((date, i) => {
                    const dateStr = formatDate(date)
                    const slotSessions = getSessionsForSlot(dateStr, block.start)
                    const isToday = formatDate(date) === formatDate(new Date())
                    const isWeekend = i >= 5
                    const canAddMore = slotSessions.length < 2
                    
                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-1 border-l border-border min-h-[70px] transition-colors",
                          isToday && "bg-primary/5",
                          isWeekend && !isToday && "bg-muted/40",
                          canAddMore && "hover:bg-secondary cursor-pointer"
                        )}
                        onClick={() => canAddMore && handleSlotClick(dateStr, block.start)}
                      >
                        <div className={cn(
                          "h-full gap-1",
                          slotSessions.length > 0 ? "flex items-start" : ""
                        )}>
                          {/* 课程卡片：1节时占满，2节时横向各半 */}
                          <div className={cn(
                            "flex-1 min-w-0",
                            slotSessions.length === 2 ? "grid grid-cols-2 gap-1" : "space-y-0"
                          )}>
                            {slotSessions.map(session => {
                              const student = getStudent(session.studentId)
                              if (!student) return null
                              return (
                                <div
                                  key={session.id}
                                  className={cn(
                                    "rounded p-1 text-xs",
                                    session.status === 'completed'
                                      ? "bg-success/20 border border-success/30"
                                      : "bg-primary/10 border border-primary/20"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-start justify-between gap-0.5">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate text-foreground text-xs leading-tight">{student.name}</div>
                                      <div className="text-muted-foreground text-xs leading-tight">{session.time}</div>
                                      {session.location && (
                                        <div className="text-muted-foreground truncate text-xs flex items-center gap-0.5">
                                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                          <span className="truncate">{session.location}</span>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteSession(session.id)
                                      }}
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </Button>
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1">
                                    <Checkbox
                                      id={`session-${session.id}`}
                                      checked={session.status === 'completed'}
                                      onCheckedChange={() => handleToggleComplete(session)}
                                      className="h-3 w-3 data-[state=checked]:bg-success data-[state=checked]:border-success"
                                    />
                                    <label
                                      htmlFor={`session-${session.id}`}
                                      className={cn(
                                        "text-xs cursor-pointer",
                                        session.status === 'completed' ? "text-success" : "text-muted-foreground"
                                      )}
                                    >
                                      {session.status === 'completed' ? '完成' : '待上课'}
                                    </label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {/* 有1节课时，在右侧显示轻盈的 + 按钮 */}
                          {slotSessions.length === 1 && (
                            <button
                              className="flex-shrink-0 w-5 flex items-center justify-center text-muted-foreground/40 hover:text-primary transition-colors self-stretch"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSlotClick(dateStr, block.start)
                              }}
                              title="添加第二节课"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Session Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">排课</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>{selectedSlot?.date}</span>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">选择学员</Label>
              <Select value={formStudentId} onValueChange={setFormStudentId}>
                <SelectTrigger className="bg-input h-9">
                  <SelectValue placeholder="请选择学员" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status !== 'ended').map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">具体时间</Label>
              <Select value={formTime} onValueChange={setFormTime}>
                <SelectTrigger className="bg-input h-9">
                  <SelectValue placeholder="选择时间" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSlot && getTimeOptionsForBlock(selectedSlot.blockStart).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">地点 (可选)</Label>
              <Input
                ref={locationRef}
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                placeholder="请输入上课地点"
                className="bg-input h-9"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>取消</Button>
              <Button size="sm" onClick={handleAddSession} disabled={!formStudentId || !formTime}>确认排课</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
