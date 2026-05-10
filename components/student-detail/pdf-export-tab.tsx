'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { FileDown, Eye, Loader2, Check, X, Minus, Circle, AlertCircle } from 'lucide-react'
import type { Student, Session, SessionRecord, TrainingPlan } from '@/lib/types'
import { getStudentProgress, formatProfit } from '@/lib/utils-helper'

interface PdfExportTabProps {
  student: Student
  sessions: Session[]
  sessionRecords: SessionRecord[]
}

interface ExportOptions {
  includeBasicInfo: boolean
  includeTrainingPlan: boolean
  includeSessionRecords: boolean
  includePhotos: boolean
  includeEffect: boolean
  includeRatings: boolean
  includeCoachMemos: boolean
}

const statusLabels: Record<string, string> = {
  excellent: '出色',
  good: '良好',
  normal: '一般',
  poor: '较差',
  bad: '糟糕',
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <Check className="w-3 h-3 text-success" />
    case 'good': return <Circle className="w-3 h-3 text-primary" />
    case 'normal': return <Minus className="w-3 h-3 text-muted-foreground" />
    case 'poor': return <AlertCircle className="w-3 h-3 text-warning" />
    case 'bad': return <X className="w-3 h-3 text-destructive" />
    default: return null
  }
}

export function PdfExportTab({ student, sessions, sessionRecords }: PdfExportTabProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    includeBasicInfo: true,
    includeTrainingPlan: true,
    includeSessionRecords: true,
    includePhotos: true,
    includeEffect: true,
    includeRatings: true,
    includeCoachMemos: false,
  })

  const progress = useMemo(() => getStudentProgress(student, sessions), [student, sessions])
  const trainingPlan: TrainingPlan = student.trainingPlan || { phases: [], overallGoal: '' }

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const generatePdfContent = () => {
    // 生成 PDF HTML 内容
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${student.name} - 训练报告</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #333;
            line-height: 1.6;
          }
          h1 { font-size: 24px; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #2dd4bf; padding-bottom: 10px; }
          h2 { font-size: 18px; margin: 30px 0 15px; color: #0d9488; border-left: 4px solid #2dd4bf; padding-left: 12px; }
          h3 { font-size: 14px; margin: 20px 0 10px; color: #666; }
          .section { margin-bottom: 30px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .info-item { padding: 10px; background: #f8f9fa; border-radius: 6px; }
          .info-label { font-size: 12px; color: #666; }
          .info-value { font-size: 14px; font-weight: 500; }
          .phase { margin-bottom: 20px; padding: 15px; background: #f0fdfa; border-radius: 8px; }
          .phase-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .phase-name { font-weight: 600; }
          .phase-range { font-size: 12px; color: #666; }
          .item { padding: 8px 12px; background: white; border-radius: 4px; margin-bottom: 6px; }
          .item-completed { text-decoration: line-through; color: #999; }
          .record { margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .record-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .record-lesson { font-weight: 600; }
          .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .status-excellent { background: #dcfce7; color: #16a34a; }
          .status-good { background: #e0f2fe; color: #0284c7; }
          .status-normal { background: #f3f4f6; color: #6b7280; }
          .status-poor { background: #fef3c7; color: #d97706; }
          .status-bad { background: #fee2e2; color: #dc2626; }
          .training-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
          .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
          .photo { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; }
          .improvement { padding: 8px 12px; background: #dcfce7; border-radius: 4px; margin-bottom: 6px; }
          .challenge { padding: 8px 12px; background: #fef3c7; border-radius: 4px; margin-bottom: 6px; }
          .rating-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; text-align: center; }
          .rating-item { padding: 10px; background: #f8f9fa; border-radius: 6px; }
          .rating-value { font-size: 20px; font-weight: 600; color: #0d9488; }
          .rating-label { font-size: 11px; color: #666; margin-top: 4px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${student.name} - 训练报告</h1>
    `

    // 基本信息
    if (options.includeBasicInfo) {
      html += `
        <div class="section">
          <h2>基本信息</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">总课时</div>
              <div class="info-value">${student.totalSessions} 节</div>
            </div>
            <div class="info-item">
              <div class="info-label">已完成</div>
              <div class="info-value">${progress.completed} 节</div>
            </div>
            <div class="info-item">
              <div class="info-label">剩余课时</div>
              <div class="info-value">${progress.remaining} 节</div>
            </div>
            <div class="info-item">
              <div class="info-label">完成进度</div>
              <div class="info-value">${progress.percentage}%</div>
            </div>
          </div>
          ${student.trainingBackground ? `
            <h3>训练背景</h3>
            <p style="padding: 10px; background: #f8f9fa; border-radius: 6px;">${student.trainingBackground}</p>
          ` : ''}
        </div>
      `
    }

    // 训练计划
    if (options.includeTrainingPlan && trainingPlan.phases.length > 0) {
      html += `
        <div class="section">
          <h2>训练计划</h2>
          ${trainingPlan.overallGoal ? `
            <h3>整体目标</h3>
            <p style="padding: 10px; background: #f0fdfa; border-radius: 6px; margin-bottom: 15px;">${trainingPlan.overallGoal}</p>
          ` : ''}
          ${trainingPlan.phases.map(phase => `
            <div class="phase">
              <div class="phase-header">
                <span class="phase-name">${phase.name}</span>
                <span class="phase-range">第 ${phase.sessionsRange[0]} - ${phase.sessionsRange[1]} 节课</span>
              </div>
              ${phase.items.map(item => `
                <div class="item ${item.completed ? 'item-completed' : ''}">
                  ${item.completed ? '✓' : '○'} ${item.name}
                  ${item.goal ? `<span style="color: #666; font-size: 12px;"> - ${item.goal}</span>` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `
    }

    // 训练记录
    if (options.includeSessionRecords && sessionRecords.length > 0) {
      html += `
        <div class="section">
          <h2>训练记录</h2>
          ${sessionRecords.filter(r => r.trainingItems.length > 0 || r.overallStatus).map(record => `
            <div class="record">
              <div class="record-header">
                <span class="record-lesson">第 ${record.lessonNumber} 节课</span>
                ${record.overallStatus ? `<span class="status-badge status-${record.overallStatus}">${statusLabels[record.overallStatus] || ''}</span>` : ''}
              </div>
              ${record.trainingItems.map(item => `
                <div class="training-item">
                  <span>${item.name}</span>
                  <span class="status-badge status-${item.status}">${statusLabels[item.status] || ''}</span>
                </div>
              `).join('')}
              ${record.statusNote ? `<p style="margin-top: 10px; font-size: 13px; color: #666;">${record.statusNote}</p>` : ''}
              ${options.includeCoachMemos && record.includeMemoInPdf && record.coachMemo ? `
                <p style="margin-top: 10px; font-size: 13px; color: #666; font-style: italic;">教练备注: ${record.coachMemo}</p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `
    }

    // 照片
    if (options.includePhotos && student.photos) {
      const { beforePhotos, afterPhotos, progressPhotos } = student.photos
      if (beforePhotos?.length || afterPhotos?.length || progressPhotos?.length) {
        html += `
          <div class="section">
            <h2>训练照片</h2>
            ${beforePhotos?.length ? `
              <h3>训练前</h3>
              <div class="photo-grid">
                ${beforePhotos.map(url => `<img src="${url}" class="photo" />`).join('')}
              </div>
            ` : ''}
            ${afterPhotos?.length ? `
              <h3>训练后</h3>
              <div class="photo-grid">
                ${afterPhotos.map(url => `<img src="${url}" class="photo" />`).join('')}
              </div>
            ` : ''}
          </div>
        `
      }
    }

    // 训练效果
    if (options.includeEffect && student.trainingEffect) {
      const { summary, improvements, challenges, nextSteps } = student.trainingEffect
      if (summary || improvements?.length || challenges?.length || nextSteps) {
        html += `
          <div class="section">
            <h2>训练效果</h2>
            ${summary ? `
              <h3>总体评价</h3>
              <p style="padding: 10px; background: #f8f9fa; border-radius: 6px;">${summary}</p>
            ` : ''}
            ${improvements?.length ? `
              <h3>主要进步</h3>
              ${improvements.map(i => `<div class="improvement">+ ${i}</div>`).join('')}
            ` : ''}
            ${challenges?.length ? `
              <h3>待改进问题</h3>
              ${challenges.map(c => `<div class="challenge">! ${c}</div>`).join('')}
            ` : ''}
            ${nextSteps ? `
              <h3>下一步计划</h3>
              <p style="padding: 10px; background: #f8f9fa; border-radius: 6px;">${nextSteps}</p>
            ` : ''}
          </div>
        `
      }
    }

    // 评分
    if (options.includeRatings && student.ratings) {
      const { strength, endurance, flexibility, balance, coordination } = student.ratings
      if (strength || endurance || flexibility || balance || coordination) {
        html += `
          <div class="section">
            <h2>能力评分</h2>
            <div class="rating-grid">
              <div class="rating-item">
                <div class="rating-value">${strength || '-'}</div>
                <div class="rating-label">力量</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${endurance || '-'}</div>
                <div class="rating-label">耐力</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${flexibility || '-'}</div>
                <div class="rating-label">柔韧</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${balance || '-'}</div>
                <div class="rating-label">平衡</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${coordination || '-'}</div>
                <div class="rating-label">协调</div>
              </div>
            </div>
          </div>
        `
      }
    }

    html += `
        <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
          生成时间: ${new Date().toLocaleString('zh-CN')}
        </div>
      </body>
      </html>
    `

    return html
  }

  const handlePreview = () => {
    setIsPreviewing(true)
    const html = generatePdfContent()
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(html)
      previewWindow.document.close()
    }
    setIsPreviewing(false)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const html = generatePdfContent()
      const previewWindow = window.open('', '_blank')
      if (previewWindow) {
        previewWindow.document.write(html)
        previewWindow.document.close()
        previewWindow.print()
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 导出选项 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">选择导出内容</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="basicInfo" 
                checked={options.includeBasicInfo}
                onCheckedChange={() => toggleOption('includeBasicInfo')}
              />
              <label htmlFor="basicInfo" className="text-sm cursor-pointer">基本信息</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="trainingPlan" 
                checked={options.includeTrainingPlan}
                onCheckedChange={() => toggleOption('includeTrainingPlan')}
              />
              <label htmlFor="trainingPlan" className="text-sm cursor-pointer">训练计划</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sessionRecords" 
                checked={options.includeSessionRecords}
                onCheckedChange={() => toggleOption('includeSessionRecords')}
              />
              <label htmlFor="sessionRecords" className="text-sm cursor-pointer">训练记录</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="photos" 
                checked={options.includePhotos}
                onCheckedChange={() => toggleOption('includePhotos')}
              />
              <label htmlFor="photos" className="text-sm cursor-pointer">训练照片</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="effect" 
                checked={options.includeEffect}
                onCheckedChange={() => toggleOption('includeEffect')}
              />
              <label htmlFor="effect" className="text-sm cursor-pointer">训练效果</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ratings" 
                checked={options.includeRatings}
                onCheckedChange={() => toggleOption('includeRatings')}
              />
              <label htmlFor="ratings" className="text-sm cursor-pointer">能力评分</label>
            </div>
            <div className="flex items-center space-x-2 col-span-2">
              <Checkbox 
                id="coachMemos" 
                checked={options.includeCoachMemos}
                onCheckedChange={() => toggleOption('includeCoachMemos')}
              />
              <label htmlFor="coachMemos" className="text-sm cursor-pointer">
                教练备忘 <span className="text-muted-foreground">(仅包含标记为导出的备忘)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 内容预览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">导出预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
            <p><strong>学员:</strong> {student.name}</p>
            <p><strong>课程进度:</strong> {progress.completed}/{student.totalSessions} 节 ({progress.percentage}%)</p>
            {options.includeTrainingPlan && (
              <p><strong>训练阶段:</strong> {trainingPlan.phases.length} 个阶段</p>
            )}
            {options.includeSessionRecords && (
              <p><strong>训练记录:</strong> {sessionRecords.filter(r => r.trainingItems.length > 0).length} 条</p>
            )}
            {options.includePhotos && student.photos && (
              <p>
                <strong>照片:</strong> {' '}
                训练前 {student.photos.beforePhotos?.length || 0} 张, 
                训练后 {student.photos.afterPhotos?.length || 0} 张,
                进展 {student.photos.progressPhotos?.length || 0} 张
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 导出按钮 */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handlePreview}
          disabled={isPreviewing}
        >
          {isPreviewing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          预览
        </Button>
        <Button 
          className="flex-1"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          导出 PDF
        </Button>
      </div>
    </div>
  )
}
