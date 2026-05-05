'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Copy } from 'lucide-react'
import type { Student, Session } from '@/lib/types'

interface RenewalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  sessions: Session[]
  onRenew: (studentId: string, addedSessions: number, addedFee: number, addedVenueFee: number) => void
}

export function RenewalForm({ open, onOpenChange, student, sessions, onRenew }: RenewalFormProps) {
  const [addedFee, setAddedFee] = useState('')
  const [addedSessions, setAddedSessions] = useState('')
  const [addedVenueFee, setAddedVenueFee] = useState('')

  const feeRef = useRef<HTMLInputElement>(null)
  const sessionsRef = useRef<HTMLInputElement>(null)
  const venueFeeRef = useRef<HTMLInputElement>(null)

  if (!student) return null

  const completedSessions = sessions.filter(
    s => s.studentId === student.id && s.status === 'completed'
  ).length
  const remainingSessions = student.totalSessions - completedSessions

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement | null> | null) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef?.current?.focus()
    }
  }

  const handleFillLast = () => {
    setAddedFee(student.totalFee.toString())
    setAddedSessions(student.totalSessions.toString())
    setAddedVenueFee(student.venueFee.toString())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sessionsNum = parseInt(addedSessions) || 0
    const fee = parseFloat(addedFee) || 0
    const venueFee = parseFloat(addedVenueFee) || 0
    
    if (sessionsNum > 0 && fee > 0) {
      onRenew(student.id, sessionsNum, fee, venueFee)
      setAddedFee('')
      setAddedSessions('')
      setAddedVenueFee('')
      onOpenChange(false)
    }
  }

  const calcSessionIncome = () => {
    const sessionsNum = parseInt(addedSessions) || 0
    const fee = parseFloat(addedFee) || 0
    const venueFee = parseFloat(addedVenueFee) || 0
    if (sessionsNum > 0) {
      return (fee / sessionsNum) - venueFee
    }
    return 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">续课 - {student.name}</DialogTitle>
          <DialogDescription>
            添加续课课时，不会创建新合同。此阶段数据不计入当前收入，确认后才纳入统计。
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-3 space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg text-sm">
            <div>
              <p className="text-xs text-muted-foreground">当前总课时</p>
              <p className="font-semibold text-foreground">{student.totalSessions} 节</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">剩余课时</p>
              <p className="font-semibold text-primary">{remainingSessions} 节</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">当前课程收费</p>
              <p className="font-semibold text-foreground">¥{student.totalFee.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">当前场地费</p>
              <p className="font-semibold text-foreground">¥{student.venueFee.toLocaleString()}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={handleFillLast}
          >
            <Copy className="w-3 h-3" />
            一键填入上次配置
          </Button>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="renewFee" className="text-foreground text-sm">续课费用 (¥)</Label>
              <Input
                ref={feeRef}
                id="renewFee"
                type="number"
                value={addedFee}
                onChange={(e) => setAddedFee(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, sessionsRef)}
                placeholder="0"
                min="0"
                required
                className="bg-input h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="renewSessions" className="text-foreground text-sm">续课节数</Label>
              <Input
                ref={sessionsRef}
                id="renewSessions"
                type="number"
                value={addedSessions}
                onChange={(e) => setAddedSessions(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, venueFeeRef)}
                placeholder="0"
                min="1"
                required
                className="bg-input h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="renewVenueFee" className="text-foreground text-sm">续课场地费 (¥/节)</Label>
              <Input
                ref={venueFeeRef}
                id="renewVenueFee"
                type="number"
                value={addedVenueFee}
                onChange={(e) => setAddedVenueFee(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                placeholder="0"
                min="0"
                required
                className="bg-input h-9"
              />
            </div>

            {addedSessions && addedFee && (
              <div className="p-3 bg-accent rounded-lg space-y-1.5">
                <p className="text-xs font-medium text-foreground">续课预览</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">单节收入：</span>
                    <span className="font-medium text-primary">
                      ¥{calcSessionIncome().toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">新增课时：</span>
                    <span className="font-medium text-foreground">{addedSessions} 节</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" size="sm">
                确认续课
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
