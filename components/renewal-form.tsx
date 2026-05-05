'use client'

import { useState } from 'react'
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
import type { Student, Session } from '@/lib/types'

interface RenewalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  sessions: Session[]
  onRenew: (studentId: string, addedSessions: number, addedFee: number) => void
}

export function RenewalForm({ open, onOpenChange, student, sessions, onRenew }: RenewalFormProps) {
  const [addedSessions, setAddedSessions] = useState('')
  const [addedFee, setAddedFee] = useState('')

  if (!student) return null

  const completedSessions = sessions.filter(
    s => s.studentId === student.id && s.status === 'completed'
  ).length
  const remainingSessions = student.totalSessions - completedSessions

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sessions = parseInt(addedSessions) || 0
    const fee = parseFloat(addedFee) || 0
    
    if (sessions > 0 && fee > 0) {
      onRenew(student.id, sessions, fee)
      setAddedSessions('')
      setAddedFee('')
      onOpenChange(false)
    }
  }

  const newSessionPrice = () => {
    const newSessions = parseInt(addedSessions) || 0
    const newFee = parseFloat(addedFee) || 0
    const totalSessions = student.totalSessions + newSessions
    const totalFee = student.totalFee + newFee
    if (totalSessions > 0) {
      return totalFee / totalSessions
    }
    return 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">续课 - {student.name}</DialogTitle>
          <DialogDescription>
            添加续课课时，不会创建新合同，仅在原有基础上累加
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">当前总课时</p>
              <p className="text-lg font-semibold text-foreground">{student.totalSessions} 节</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">剩余课时</p>
              <p className="text-lg font-semibold text-primary">{remainingSessions} 节</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">当前总费用</p>
              <p className="text-lg font-semibold text-foreground">¥{student.totalFee.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">当前单价</p>
              <p className="text-lg font-semibold text-foreground">¥{student.sessionPrice.toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addedSessions" className="text-foreground">新增课时</Label>
                <Input
                  id="addedSessions"
                  type="number"
                  value={addedSessions}
                  onChange={(e) => setAddedSessions(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addedFee" className="text-foreground">新增费用 (¥)</Label>
                <Input
                  id="addedFee"
                  type="number"
                  value={addedFee}
                  onChange={(e) => setAddedFee(e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                  className="bg-input"
                />
              </div>
            </div>

            {addedSessions && addedFee && (
              <div className="p-4 bg-accent rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground">续课后预览</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">新总课时：</span>
                    <span className="font-medium text-foreground">
                      {student.totalSessions + (parseInt(addedSessions) || 0)} 节
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">新总费用：</span>
                    <span className="font-medium text-foreground">
                      ¥{(student.totalFee + (parseFloat(addedFee) || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">新单价：</span>
                    <span className="font-medium text-primary">
                      ¥{newSessionPrice().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit">
                确认续课
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
