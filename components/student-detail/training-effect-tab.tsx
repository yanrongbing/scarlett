'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import type { Student, TrainingEffect, TrainingEffectRecord } from '@/lib/types'

interface TrainingEffectTabProps {
  student: Student
  onUpdateStudent?: (updates: Partial<Student>) => void
}

export function TrainingEffectTab({ student, onUpdateStudent }: TrainingEffectTabProps) {
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newLessonNumber, setNewLessonNumber] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [newBodyFatPercentage, setNewBodyFatPercentage] = useState('')
  const [newSkeletalMusclePercentage, setNewSkeletalMusclePercentage] = useState('')
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newSummary, setNewSummary] = useState('')

  const rawEffect = student.trainingEffect || {}
  const trainingEffect: TrainingEffect = {
    records: Array.isArray(rawEffect.records) ? rawEffect.records : [],
  }

  const handleUpdateEffect = (updates: Partial<TrainingEffect>) => {
    if (!onUpdateStudent) return
    onUpdateStudent({
      trainingEffect: { ...trainingEffect, ...updates },
    })
  }

  const handleAddRecord = () => {
    if (!newDate || !newLessonNumber || !newPhotoUrl || !newSummary.trim()) {
      alert('请填入所有字段')
      return
    }

    const record: TrainingEffectRecord = {
      id: Date.now().toString(),
      date: newDate,
      lessonNumber: parseInt(newLessonNumber),
      weight: newWeight ? parseFloat(newWeight) : undefined,
      bodyFatPercentage: newBodyFatPercentage ? parseFloat(newBodyFatPercentage) : undefined,
      skeletalMusclePercentage: newSkeletalMusclePercentage ? parseFloat(newSkeletalMusclePercentage) : undefined,
      photoUrl: newPhotoUrl,
      summary: newSummary,
      createdAt: new Date().toISOString(),
    }

    handleUpdateEffect({
      records: [...trainingEffect.records, record],
    })

    setNewDate('')
    setNewLessonNumber('')
    setNewWeight('')
    setNewBodyFatPercentage('')
    setNewSkeletalMusclePercentage('')
    setNewPhotoUrl('')
    setNewSummary('')
    setShowAddRecord(false)
  }

  const handleDeleteRecord = (recordId: string) => {
    handleUpdateEffect({
      records: trainingEffect.records.filter(r => r.id !== recordId),
    })
  }

  // 按日期倒序排列
  const sortedRecords = [...trainingEffect.records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-4">
      {/* 标题和添加按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">训练效果<span className="text-xs text-muted-foreground ml-1">（不定期）</span></h3>
        </div>
        {!showAddRecord && (
          <Button size="sm" onClick={() => setShowAddRecord(true)}>
            <Plus className="w-3 h-3 mr-1" />
            新增记录
          </Button>
        )}
      </div>

      {/* 新增记录表单 */}
      {showAddRecord && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">日期</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">节数</Label>
                <Input
                  type="number"
                  value={newLessonNumber}
                  onChange={(e) => setNewLessonNumber(e.target.value)}
                  placeholder="第几节课"
                />
              </div>
              <div>
                <Label className="text-sm">体重（kg）</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="75.5"
                />
              </div>
              <div>
                <Label className="text-sm">体脂率（%）</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newBodyFatPercentage}
                  onChange={(e) => setNewBodyFatPercentage(e.target.value)}
                  placeholder="20.5"
                />
              </div>
              <div>
                <Label className="text-sm">骨骼肌率（%）</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newSkeletalMusclePercentage}
                  onChange={(e) => setNewSkeletalMusclePercentage(e.target.value)}
                  placeholder="40.2"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">训练后照片URL</Label>
              <Input
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="输入照片链接"
              />
              {newPhotoUrl && (
                <div className="mt-2 rounded-lg overflow-hidden bg-muted h-40 flex items-center justify-center">
                  <img
                    src={newPhotoUrl}
                    alt="preview"
                    className="max-h-full max-w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm">小结</Label>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="本次训练的小结..."
                className="w-full h-20 p-2 border border-border rounded-lg text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowAddRecord(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleAddRecord}>
                保存
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 训练效果记录列表 */}
      <div className="space-y-3">
        {sortedRecords.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              暂无训练效果记录
            </CardContent>
          </Card>
        ) : (
          sortedRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">{record.date} · 第 {record.lessonNumber} 节课</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteRecord(record.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* 身体数据 */}
                {(record.weight || record.bodyFatPercentage || record.skeletalMusclePercentage) && (
                  <div className="mb-3 p-3 bg-muted rounded-lg grid grid-cols-3 gap-2 text-xs">
                    {record.weight && (
                      <div>
                        <p className="text-muted-foreground">体重</p>
                        <p className="font-medium">{record.weight} kg</p>
                      </div>
                    )}
                    {record.bodyFatPercentage && (
                      <div>
                        <p className="text-muted-foreground">体脂率</p>
                        <p className="font-medium">{record.bodyFatPercentage}%</p>
                      </div>
                    )}
                    {record.skeletalMusclePercentage && (
                      <div>
                        <p className="text-muted-foreground">骨骼肌率</p>
                        <p className="font-medium">{record.skeletalMusclePercentage}%</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 照片 */}
                {record.photoUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-muted h-40 flex items-center justify-center">
                    <img
                      src={record.photoUrl}
                      alt="training"
                      className="max-h-full max-w-full object-cover"
                    />
                  </div>
                )}

                {/* 小结 */}
                <p className="text-sm text-foreground whitespace-pre-wrap">{record.summary}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
