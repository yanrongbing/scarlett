'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Star, ArrowLeft } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { Student, RatingDimensions } from '@/lib/types'
import { getStudentProgress, calculateCompositeScore, formatProfit } from '@/lib/utils-helper'

interface StudentDetailProps {
  student: Student | null
  sessions: { id: string; studentId: string; date: string; time: string; status: string }[]
  onBack: () => void
  onEdit: () => void
  onUpdateRatings: (ratings: RatingDimensions) => void
}

export function StudentDetail({
  student,
  sessions,
  onBack,
  onEdit,
  onUpdateRatings,
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
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{label}:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i <= (value as number)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{value}/5</span>
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
                    <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      stroke="hsl(var(--border))"
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
      <div className="grid gap-4 md:grid-cols-2">
        {student.trainingPlanPdf && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">训练计划PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" asChild>
                <a href={student.trainingPlanPdf} download="training-plan.pdf">
                  下载PDF
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
        {student.contractPdf && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">合同文档</CardTitle>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" asChild>
                <a href={student.contractPdf} download="contract.pdf">
                  下载PDF
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
