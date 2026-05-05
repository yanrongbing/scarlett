'use client'

import { useState, useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, FileText, X } from 'lucide-react'
import type { Student, CourseType, StudentSource } from '@/lib/types'

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (student: Omit<Student, 'id' | 'completedSessions' | 'createdAt' | 'renewalHistory'>) => void
  initialData?: Student
}

const courseTypes: { value: CourseType; label: string }[] = [
  { value: 'online', label: '线上' },
  { value: 'offline', label: '线下' },
]

const sourceTypes: { value: StudentSource; label: string }[] = [
  { value: 'social_media', label: '社媒' },
  { value: 'referral', label: '转介绍' },
  { value: 'friend', label: '朋友' },
  { value: 'other', label: '其他' },
]

export function StudentForm({ open, onOpenChange, onSubmit, initialData }: StudentFormProps) {
  const [name, setName] = useState('')
  const [courseType, setCourseType] = useState<CourseType>('offline')
  const [source, setSource] = useState<StudentSource>('social_media')
  const [totalSessions, setTotalSessions] = useState('')
  const [totalFee, setTotalFee] = useState('')
  const [venueFee, setVenueFee] = useState('')
  const [trainingBackground, setTrainingBackground] = useState('')
  const [trainingPlanPdf, setTrainingPlanPdf] = useState<string | undefined>()
  const [contractPdf, setContractPdf] = useState<string | undefined>()

  // Refs for Enter-to-next-field
  const nameRef = useRef<HTMLInputElement>(null)
  const totalFeeRef = useRef<HTMLInputElement>(null)
  const totalSessionsRef = useRef<HTMLInputElement>(null)
  const venueFeeRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || '')
      setCourseType(initialData.courseType || 'offline')
      setSource(initialData.source || 'social_media')
      setTotalSessions(initialData.totalSessions?.toString() || '')
      setTotalFee(initialData.totalFee?.toString() || '')
      setVenueFee(initialData.venueFee?.toString() || '')
      setTrainingBackground(initialData.trainingBackground || '')
      setTrainingPlanPdf(initialData.trainingPlanPdf)
      setContractPdf(initialData.contractPdf)
    } else if (open && !initialData) {
      setName('')
      setCourseType('offline')
      setSource('social_media')
      setTotalSessions('')
      setTotalFee('')
      setVenueFee('')
      setTrainingBackground('')
      setTrainingPlanPdf(undefined)
      setContractPdf(undefined)
    }
  }, [open, initialData])

  // Auto-calculate session price
  const sessionPrice = useMemo(() => {
    const sessions = parseFloat(totalSessions) || 0
    const fee = parseFloat(totalFee) || 0
    if (sessions > 0 && fee > 0) {
      return fee / sessions
    }
    return 0
  }, [totalSessions, totalFee])

  // Auto-calculate: 单节利润 = 单次课费 - 场地费
  const sessionIncome = useMemo(() => {
    const venue = parseFloat(venueFee) || 0
    return sessionPrice - venue
  }, [sessionPrice, venueFee])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement | null> | null) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef?.current?.focus()
    }
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string | undefined) => void
  ) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setter(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      courseType,
      source,
      totalSessions: parseInt(totalSessions) || 0,
      totalFee: parseFloat(totalFee) || 0,
      sessionPrice,
      venueFee: parseFloat(venueFee) || 0,
      sessionIncome,
      trainingBackground,
      trainingPlanPdf,
      contractPdf,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {initialData ? '编辑学员' : '添加学员'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-foreground">姓名</Label>
              <Input
                ref={nameRef}
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, totalFeeRef)}
                placeholder="请输入姓名"
                required
                className="bg-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="courseType" className="text-foreground">课程类型</Label>
              <Select value={courseType} onValueChange={(v) => setCourseType(v as CourseType)}>
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courseTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source" className="text-foreground">学员来源</Label>
            <Select value={source} onValueChange={(v) => setSource(v as StudentSource)}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="totalFee" className="text-foreground">课程收费 (元)</Label>
              <Input
                ref={totalFeeRef}
                id="totalFee"
                type="number"
                value={totalFee}
                onChange={(e) => setTotalFee(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, totalSessionsRef)}
                placeholder="0"
                min="0"
                className="bg-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalSessions" className="text-foreground">课时</Label>
              <Input
                ref={totalSessionsRef}
                id="totalSessions"
                type="number"
                value={totalSessions}
                onChange={(e) => setTotalSessions(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, venueFeeRef)}
                placeholder="0"
                min="0"
                className="bg-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venueFee" className="text-foreground">场地费 (元/次)</Label>
            <Input
              ref={venueFeeRef}
              id="venueFee"
              type="number"
              value={venueFee}
              onChange={(e) => setVenueFee(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              placeholder="0"
              min="0"
              className="bg-input"
            />
          </div>

          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">单次课费 (自动计算)</span>
              <span className="font-semibold text-foreground">¥{sessionPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">单节课收入 (课费 - 场地费)</span>
              <span className="font-semibold text-primary">¥{sessionIncome.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="trainingBackground" className="text-foreground">训练背景和目标</Label>
            <p className="text-xs text-muted-foreground">学员基本情况，训练诉求，初次沟通后确认的关键问题等。</p>
            <Textarea
              id="trainingBackground"
              value={trainingBackground}
              onChange={(e) => setTrainingBackground(e.target.value)}
              placeholder="请输入学员的训练背景和目标..."
              rows={3}
              className="bg-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground">训练计划 PDF（可选）</Label>
            <div className="flex items-center gap-3">
              {trainingPlanPdf ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg flex-1">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground flex-1">训练计划已上传</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setTrainingPlanPdf(undefined)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">上传训练计划 PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setTrainingPlanPdf)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground">合同文档（可选）</Label>
            <div className="flex items-center gap-3">
              {contractPdf ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg flex-1">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground flex-1">合同已上传</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setContractPdf(undefined)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">上传合同文档 PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setContractPdf)}
                  />
                </label>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              {initialData ? '保存' : '添加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
