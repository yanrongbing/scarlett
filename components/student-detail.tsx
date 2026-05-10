'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Star, ArrowLeft, Upload, FileText, Eye, X, RefreshCw, Pause, CheckCircle, DollarSign, XCircle } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { Student, RatingDimensions } from '@/lib/types'
import { getStudentProgress, calculateCompositeScore, formatProfit } from '@/lib/utils-helper'

interface StudentDetailProps {
  student: Student | null
  sessions: { id: string; studentId: string; date: string; time: string; status: string }[]
  onBack: () => void
  onEdit: () => void
  onUpdateRatings: (ratings: RatingDimensions) => void
  onUpdateStudent?: (updates: Partial<Student>) => void
  onRenewStudent?: (student: Student) => void
  onPauseCourse?: (studentId: string) => void
  onEndCourse?: (studentId: string) => void
  onRefundCourse?: (studentId: string, refundAmount: number) => void
}

export function StudentDetail({
  student,
  sessions,
  onBack,
  onEdit,
  onUpdateRatings,
  onUpdateStudent,
  onRenewStudent,
  onPauseCourse,
  onEndCourse,
  onRefundCourse,
}: StudentDetailProps) {
  const [isEditingRatings, setIsEditingRatings] = useState(false)
  const [ratings, setRatings] = useState<RatingDimensions>(
    student?.ratings || {
      trust: 0,
      execution: 0,
      cognition: 0,
      learning: 0,
      loyalty: 0,
    }
  )
  const [previewPdf, setPreviewPdf] = useState<string | null>(null)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundConfirm, setRefundConfirm] = useState(false)
  const trainingPlanInputRef = useRef<HTMLInputElement>(null)
  const contractInputRef = useRef<HTMLInputElement>(null)

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">学员信息不存在</p>
      </div>
    )
  }

  const progress = getStudentProgress(student)
  const compositeScore = calculateCompositeScore(student.ratings)
  const studentSessions = sessions.filter(s => s.studentId === student.id)
  const completedCount = studentSessions.filter(s => s.status === 'completed').length
  const plannedCount = studentSessions.filter(s => s.status === 'planned').length

  const radarData = [
    { name: '信任度', value: student.ratings?.trust || 0 },
    { name: '执行力', value: student.ratings?.execution || 0 },
    { name: '认知水平', value: student.ratings?.cognition || 0 },
    { name: '求知欲', value: student.ratings?.learning || 0 },
    { name: '粘性', value: student.ratings?.loyalty || 0 },
  ]

  const handleRatingChange = (dimension: keyof RatingDimensions, value: number) => {
    const newRatings = {
      ...ratings,
      [dimension]: Math.max(1, Math.min(5, value)),
    }
    setRatings(newRatings)
  }

  const handleSaveRatings = () => {
    onUpdateRatings(ratings)
    setIsEditingRatings(false)
  }

  const handleFileUpload = (type: 'trainingPlan' | 'contract', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onUpdateStudent) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (type === 'trainingPlan') {
        onUpdateStudent({ trainingPlanPdf: dataUrl })
      } else {
        onUpdateStudent({ contractPdf: dataUrl })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRefundSubmit = () => {
    if (!student || !onRefundCourse) return
    const amount = parseFloat(refundAmount)
    if (isNaN(amount) || amount <= 0) return
    
    if (!refundConfirm) {
      setRefundConfirm(true)
      return
    }
    
    onRefundCourse(student.id, amount)
    setShowRefundDialog(false)
    setRefundAmount('')
    setRefundConfirm(false)
    onBack()
  }

  // 检查是否需要续课提醒
  const needRenewal = progress.remaining <= 4 && progress.remaining >= 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
        </div>
        <Button onClick={onEdit} variant="default" size="sm">
          编辑
        </Button>
      </div>

      {/* Basic Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">课程类型:</span>
              <span className="font-medium">{student.courseType === 'online' ? '线上' : '线下'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">学员来源:</span>
              <span className="font-medium">
                {student.source === 'social_media' ? '社媒' : student.source === 'referral' ? '转介绍' : student.source === 'friend' ? '朋友' : '其他'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">加入时间:</span>
              <span className="font-medium">{new Date(student.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">课程购买信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">课程收费:</span>
              <span className="font-medium">¥{Math.round(student.totalFee).toLocaleString('zh-CN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">总课时:</span>
              <span className="font-medium">{student.totalSessions} 节</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">单节课费:</span>
              <span className="font-medium">¥{Math.round(student.sessionPrice).toLocaleString('zh-CN')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Info */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">课时进度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{progress.completed}</p>
              <p className="text-xs text-muted-foreground">已上课时</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{progress.remaining}</p>
              <p className="text-xs text-muted-foreground">剩余课时</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{progress.total}</p>
              <p className="text-xs text-muted-foreground">总课时</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{progress.percentage}%</p>
              <p className="text-xs text-muted-foreground">完成度</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">已排课: {plannedCount + completedCount} 节 (已上: {completedCount}, 计划: {plannedCount})</p>
          </div>
        </CardContent>
      </Card>

      {/* Ratings */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">学员评分</CardTitle>
          {!isEditingRatings && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingRatings(true)}
            >
              编辑评分
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              {isEditingRatings ? (
                <div className="space-y-4">
                  {Object.entries(ratings).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      trust: '信任度',
                      execution: '执行力',
                      cognition: '认知水平',
                      learning: '求知欲',
                      loyalty: '粘性',
                    }
                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-sm">{labels[key]}</Label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() =>
                                handleRatingChange(key as keyof RatingDimensions, star)
                              }
                              className={`transition-colors ${
                                star <= value
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                          <span className="text-sm text-muted-foreground">
                            {value}/5
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-4 flex gap-2">
                    <Button size="sm" onClick={handleSaveRatings}>
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingRatings(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">
                      {compositeScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">综合评分 / 5.0</p>
                  </div>
                  {student.ratings && (
                    <div className="space-y-2 text-sm">
                      {[
                        ['trust', '信任度', student.ratings.trust],
                        ['execution', '执行力', student.ratings.execution],
                        ['cognition', '认知水平', student.ratings.cognition],
                        ['learning', '求知欲', student.ratings.learning],
                        ['loyalty', '粘性', student.ratings.loyalty],
                      ].map(([, label, value]) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-muted-foreground w-16">{label}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i <= (value as number)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium w-8 text-right">{value}/5</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {student.ratings && !isEditingRatings && (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="评分"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.25}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Info */}
      {student.trainingBackground && (
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">训练背景和目标</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap">{student.trainingBackground}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">文档管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* 训练计划 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">训练计划PDF</Label>
              <input
                ref={trainingPlanInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileUpload('trainingPlan', e)}
              />
              {student.trainingPlanPdf ? (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => setPreviewPdf(student.trainingPlanPdf!)}
                  >
                    <Eye className="w-3 h-3" />
                    预览
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => trainingPlanInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3" />
                    更换
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => trainingPlanInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3" />
                  上传训练计划
                </Button>
              )}
            </div>

            {/* 合同 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">合同文档</Label>
              <input
                ref={contractInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileUpload('contract', e)}
              />
              {student.contractPdf ? (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => setPreviewPdf(student.contractPdf!)}
                  >
                    <Eye className="w-3 h-3" />
                    预览
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => contractInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3" />
                    更换
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => contractInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3" />
                  上传合同
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学员状态 */}
      {student.status === 'ended' && (
        <Card className="bg-card border-border border-muted-foreground/50 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-base px-4 py-1">已结课</Badge>
              {student.refundAmount && (
                <Badge variant="destructive" className="text-base px-4 py-1">
                  退费 ¥{student.refundAmount.toLocaleString()}
                </Badge>
              )}
              {student.endedAt && (
                <span className="text-sm text-muted-foreground">
                  结课时间: {new Date(student.endedAt).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮区域 - 仅在非结课状态显示 */}
      {student.status !== 'ended' && (
        <Card className="bg-card border-border mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className={needRenewal 
                  ? "bg-success hover:bg-success/90 text-white animate-pulse" 
                  : "bg-success hover:bg-success/90 text-white"
                }
                onClick={() => onRenewStudent?.(student)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                续课
              </Button>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => onPauseCourse?.(student.id)}
              >
                <Pause className="w-4 h-4 mr-2" />
                暂停
              </Button>
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background"
                onClick={() => onEndCourse?.(student.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                结课
              </Button>
              <Button
                size="lg"
                className="bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => setShowRefundDialog(true)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                退费
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 退费弹窗 */}
      {showRefundDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <h3 className="text-lg font-semibold">退费 - {student.name}</h3>
              </div>
              
              {!refundConfirm ? (
                <>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
                      <p>已完成课时：{completedCount} 节</p>
                      <p>总收费：¥{student.totalFee.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>退费金额 (¥)</Label>
                      <Input
                        type="number"
                        placeholder="输入退费金额"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                    </div>
                    {refundAmount && parseFloat(refundAmount) > 0 && (
                      <div className="p-3 bg-warning/10 rounded-md text-sm text-warning">
                        退费后实际收费：¥{(student.totalFee - parseFloat(refundAmount)).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => {
                      setShowRefundDialog(false)
                      setRefundAmount('')
                    }}>
                      取消
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleRefundSubmit}
                      disabled={!refundAmount || parseFloat(refundAmount) <= 0}
                    >
                      下一步
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-destructive/10 rounded-md space-y-2">
                    <p className="text-sm font-medium text-destructive">确认退费信息</p>
                    <p className="text-sm">退费金额：¥{parseFloat(refundAmount).toLocaleString()}</p>
                    <p className="text-sm">退费后该学员将标记为已结课，利润将重新计算。</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setRefundConfirm(false)}>
                      返回
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleRefundSubmit}
                    >
                      确认退费
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* PDF预览弹窗 */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-medium">PDF预览</h3>
              <Button variant="ghost" size="icon" onClick={() => setPreviewPdf(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewPdf}
                className="w-full h-full rounded border border-border"
                title="PDF预览"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
