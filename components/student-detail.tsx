'use client'

import { useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, ArrowLeft, Upload, FileText, Eye, X, RefreshCw, Pause, CheckCircle, DollarSign, XCircle, ClipboardList, BookOpen, TrendingUp, FileDown, User, Trash2 } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { Student, Session, SessionRecord, RatingDimensions } from '@/lib/types'
import { getStudentProgress, calculateCompositeScore, formatProfit } from '@/lib/utils-helper'
import { TrainingPlanTab } from '@/components/student-detail/training-plan-tab'
import { SessionRecordsTab } from '@/components/student-detail/session-records-tab'
import { TrainingEffectTab } from '@/components/student-detail/training-effect-tab'
import { PdfExportTab } from '@/components/student-detail/pdf-export-tab'

interface StudentDetailProps {
  student: Student | null
  sessions: Session[]
  sessionRecords: SessionRecord[]
  onBack: () => void
  onEdit: () => void
  onUpdateRatings: (ratings: RatingDimensions) => void
  onUpdateStudent?: (updates: Partial<Student>) => void
  onUpdateSessionRecord?: (record: SessionRecord) => void
  onRenewStudent?: (student: Student) => void
  onPauseCourse?: (studentId: string) => void
  onEndCourse?: (studentId: string) => void
  onRefundCourse?: (studentId: string, refundAmount: number) => void
  onDeleteStudent?: (studentId: string) => void
}

export function StudentDetail({
  student,
  sessions,
  sessionRecords,
  onBack,
  onEdit,
  onUpdateRatings,
  onUpdateStudent,
  onUpdateSessionRecord,
  onRenewStudent,
  onPauseCourse,
  onEndCourse,
  onRefundCourse,
  onDeleteStudent,
}: StudentDetailProps) {
  const [activeTab, setActiveTab] = useState('info')
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const trainingPlanInputRef = useRef<HTMLInputElement>(null)
  const contractInputRef = useRef<HTMLInputElement>(null)

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">学员信息不存在</p>
      </div>
    )
  }

  const progress = getStudentProgress(student, sessions)
  const compositeScore = calculateCompositeScore(student.ratings)
  const studentSessions = sessions.filter(s => s.studentId === student.id)
  const completedCount = studentSessions.filter(s => s.status === 'completed').length
  const studentRecords = sessionRecords.filter(r => r.studentId === student.id)

  const radarData = [
    { name: '信任度', value: student.ratings?.trust || 0 },
    { name: '执行力', value: student.ratings?.execution || 0 },
    { name: '认知水平', value: student.ratings?.cognition || 0 },
    { name: '求知欲', value: student.ratings?.learning || 0 },
    { name: '粘性', value: student.ratings?.loyalty || 0 },
  ]

  const handleRatingChange = (dimension: keyof RatingDimensions, value: number) => {
    const newRatings = { ...ratings, [dimension]: value }
    setRatings(newRatings)
  }

  const handleRatingSave = () => {
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

  const needRenewal = progress.remaining <= 4 && progress.remaining >= 0

  const handleDeleteStudent = () => {
    if (!student || !onDeleteStudent) return
    if (deleteConfirmName !== student.name) return
    
    onDeleteStudent(student.id)
    setShowDeleteDialog(false)
    setDeleteConfirmName('')
    onBack()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{student.name}</h1>
              <p className="text-xs text-muted-foreground">
                {progress.completed}/{student.totalSessions} 节 · {progress.percentage}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={student.status === 'active' ? 'default' : student.status === 'paused' ? 'secondary' : 'outline'}>
              {student.status === 'active' ? '活跃' : student.status === 'paused' ? '暂停' : '已结课'}
            </Badge>
            <Button variant="outline" size="sm" onClick={onEdit}>
              编辑
            </Button>
            {onDeleteStudent && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tab导航 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b-0 overflow-x-auto">
            <TabsTrigger 
              value="info" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
            >
              <User className="w-4 h-4 mr-1.5" />
              基本信息
            </TabsTrigger>
            <TabsTrigger 
              value="plan" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
            >
              <ClipboardList className="w-4 h-4 mr-1.5" />
              训练计划
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              训练记录
            </TabsTrigger>
            <TabsTrigger 
              value="effect" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              训练效果
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
            >
              <FileDown className="w-4 h-4 mr-1.5" />
              导出PDF
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab内容 */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* 基本信息Tab */}
          <TabsContent value="info" className="mt-0 space-y-6">
            {/* 进度概览 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">课程进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>已完成 {progress.completed} 节</span>
                      <span>剩余 {progress.remaining} 节</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">{progress.percentage}%</div>
                </div>
              </CardContent>
            </Card>

            {/* 费用信息 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">费用信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">总费用</p>
                    <p className="text-lg font-semibold">¥{student.totalFee.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">单节课价</p>
                    <p className="text-lg font-semibold">¥{student.sessionPrice.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">场地费/节</p>
                    <p className="text-lg font-semibold">¥{student.venueFee}</p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg">
                    <p className="text-xs text-success">单节利润</p>
                    <p className="text-lg font-semibold text-success">
                      {formatProfit(student.sessionIncome || (student.sessionPrice - student.venueFee))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 联系方式 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">电话</span>
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.wechat && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">微信</span>
                    <span>{student.wechat}</span>
                  </div>
                )}
                {student.source && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">来源</span>
                    <span>
                      {student.source === 'social_media' ? '社媒' :
                       student.source === 'referral' ? '转介绍' :
                       student.source === 'friend' ? '朋友' : '其他'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 训练背景 */}
            {student.trainingBackground && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">训练背景</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {student.trainingBackground}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 五维评分 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">五维评分</CardTitle>
                  <div className="flex items-center gap-2">
                    {compositeScore > 0 && (
                      <Badge variant="outline" className="text-primary">
                        综合 {compositeScore.toFixed(1)} 分
                      </Badge>
                    )}
                    {isEditingRatings ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingRatings(false)}>取消</Button>
                        <Button size="sm" onClick={handleRatingSave}>保存</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingRatings(true)}>编辑</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditingRatings ? (
                  <div className="space-y-4">
                    {(['trust', 'execution', 'cognition', 'learning', 'loyalty'] as const).map((key) => {
                      const labels: Record<string, string> = {
                        trust: '信任度',
                        execution: '执行力',
                        cognition: '认知水平',
                        learning: '求知欲',
                        loyalty: '粘性',
                      }
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-20 text-sm">{labels[key]}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <Button
                                key={v}
                                size="sm"
                                variant={ratings[key] >= v ? 'default' : 'outline'}
                                className="w-8 h-8 p-0"
                                onClick={() => handleRatingChange(key, v)}
                              >
                                <Star className={`w-4 h-4 ${ratings[key] >= v ? 'fill-current' : ''}`} />
                              </Button>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{ratings[key] || 0}/5</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} axisLine={false} />
                        <Radar
                          name="评分"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 文档资料 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">文档资料</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 训练计划PDF */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">训练计划</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.trainingPlanPdf ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setPreviewPdf(student.trainingPlanPdf!)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onUpdateStudent?.({ trainingPlanPdf: undefined })}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => trainingPlanInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-1" />
                        上传
                      </Button>
                    )}
                    <input
                      ref={trainingPlanInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload('trainingPlan', e)}
                    />
                  </div>
                </div>

                {/* 合同PDF */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">合同文件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.contractPdf ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setPreviewPdf(student.contractPdf!)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onUpdateStudent?.({ contractPdf: undefined })}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => contractInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-1" />
                        上传
                      </Button>
                    )}
                    <input
                      ref={contractInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload('contract', e)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 学员状态 */}
            {student.status === 'ended' && (
              <Card className="border-muted-foreground/50">
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

            {/* 操作按钮区域 */}
            {student.status !== 'ended' && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      className={needRenewal 
                        ? "text-success border-success/50 font-semibold" 
                        : "text-success border-success/40"
                      }
                      onClick={() => onRenewStudent?.(student)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      续课
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-blue border-blue/40"
                      onClick={() => onPauseCourse?.(student.id)}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      暂停
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-foreground border-border"
                      onClick={() => onEndCourse?.(student.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      结课
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-destructive border-destructive/40"
                      onClick={() => setShowRefundDialog(true)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      退费
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 训练计划Tab */}
          <TabsContent value="plan" className="mt-0">
            <TrainingPlanTab 
              student={student} 
              onUpdateStudent={onUpdateStudent || (() => {})} 
            />
          </TabsContent>

          {/* 训练记录Tab */}
          <TabsContent value="records" className="mt-0">
            <SessionRecordsTab 
              student={student}
              sessions={sessions}
              sessionRecords={studentRecords}
              onUpdateSessionRecord={onUpdateSessionRecord || (() => {})}
            />
          </TabsContent>

          {/* 训练效果Tab */}
          <TabsContent value="effect" className="mt-0">
            <TrainingEffectTab 
              student={student}
              onUpdateStudent={onUpdateStudent || (() => {})}
            />
          </TabsContent>

          {/* PDF导出Tab */}
          <TabsContent value="export" className="mt-0">
            <PdfExportTab 
              student={student}
              sessions={sessions}
              sessionRecords={studentRecords}
            />
          </TabsContent>
        </Tabs>
      </div>

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

      {/* 删除学员确认弹窗 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                <h3 className="text-lg font-semibold">删除学员档案</h3>
              </div>
              
              <div className="p-4 bg-destructive/10 rounded-md space-y-2">
                <p className="text-sm font-medium text-destructive">此操作不可撤销！</p>
                <p className="text-sm">将永久删除 <strong>{student.name}</strong> 的全部档案，包括：</p>
                <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
                  <li>基本信息和评分</li>
                  <li>训练计划和训练记录</li>
                  <li>训练效果记录</li>
                  <li>所有课程记录</li>
                  <li>相关收入和利润统计</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Label>请输入学员姓名 <strong>{student.name}</strong> 以确认删除：</Label>
                <Input
                  placeholder="输入学员姓名确认"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteConfirmName('')
                }}>
                  取消
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteStudent}
                  disabled={deleteConfirmName !== student.name}
                >
                  确认删除
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PDF预览弹窗 */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-medium">文档预览</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewPdf(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <iframe src={previewPdf} className="w-full h-full rounded border" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
