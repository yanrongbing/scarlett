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
  const rawPlan = student.trainingPlan || {}
  const trainingPlan: TrainingPlan = {
    bodyInfo: rawPlan.bodyInfo || {},
    overallStrategy: rawPlan.overallStrategy || '',
    phases: Array.isArray(rawPlan.phases) ? rawPlan.phases : [],
  }

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
        <title>姜贝果教练学员训练方案-${student.name}</title>
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
          .data-comparison { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
          .comparison-item { padding: 12px; background: #f8f9fa; border-radius: 6px; }
          .comparison-label { font-size: 12px; color: #666; margin-bottom: 4px; }
          .comparison-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .comparison-value { font-weight: 600; }
          .comparison-change { font-size: 12px; padding: 2px 6px; border-radius: 3px; }
          .comparison-up { background: #dcfce7; color: #16a34a; }
          .comparison-down { background: #fee2e2; color: #dc2626; }
          .comparison-neutral { background: #f3f4f6; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>姜贝果教练学员训练方案-${student.name}</h1>
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
          ${trainingPlan.overallStrategy ? `
            <h3>整体策略</h3>
            <p style="padding: 10px; background: #f0fdfa; border-radius: 6px; margin-bottom: 15px;">${trainingPlan.overallStrategy}</p>
          ` : ''}
          ${trainingPlan.phases.map(phase => `
            <div class="phase">
              <div class="phase-header">
                <span class="phase-name">${phase.name}</span>
                <span class="phase-range">${phase.duration} · ${phase.sessionCount} 节课</span>
              </div>
              ${phase.trainingProjects && phase.trainingProjects.length ? `
                <h3 style="font-size: 13px; margin: 8px 0 4px;">训练项目：</h3>
                ${phase.trainingProjects.map(proj => `
                  <div class="item">
                    <strong>${proj.name}</strong>
                    ${proj.description ? `<p style="font-size: 12px; color: #666; margin-top: 2px;">${proj.description}</p>` : ''}
                  </div>
                `).join('')}
              ` : ''}
              ${phase.dietSuggestions ? `
                <h3 style="font-size: 13px; margin: 8px 0 4px;">饮食建议：</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${phase.dietSuggestions}</p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `
    }

    // 训练记录（已简化为训练效果记录）
    // SessionRecord 现在主要用于训练效果模块，不在此处显示
    // 训练记录已整合到训练效果部分

    // 初始体态照片
    if (student.trainingPlan?.bodyInfo?.bodyPhotoBase64) {
      html += `
        <div class="section">
          <h2>初始体态照片</h2>
          <div style="text-align: center;">
            <img src="${student.trainingPlan.bodyInfo.bodyPhotoBase64}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 400px;" />
          </div>
        </div>
      `
    }

    // 训练效果
    if (options.includeEffect && student.trainingEffect) {
      const effect = student.trainingEffect
      const records = Array.isArray(effect.records) ? effect.records : []
      
      if (records.length > 0 || effect.summary) {
        const initialBodyInfo = student.trainingPlan?.bodyInfo || {}
        const latestRecord = records.length > 0 ? records[records.length - 1] : null
        
        html += `
          <div class="section">
            <h2>训练效果</h2>
        `
        
        // 身体数据对比
        if (initialBodyInfo || latestRecord) {
          html += `
            <h3>身体数据对比</h3>
            <div class="data-comparison">
              <div class="comparison-item">
                <div class="comparison-label">体重 (kg)</div>
                <div class="comparison-row">
                  <span>初始:</span>
                  <span class="comparison-value">${initialBodyInfo.weight || '-'}</span>
                </div>
                <div class="comparison-row">
                  <span>最新:</span>
                  <span class="comparison-value">${latestRecord?.weight || '-'}</span>
                </div>
                ${latestRecord?.weight && initialBodyInfo.weight ? `
                  <div class="comparison-row" style="border-bottom: none;">
                    <span>变化:</span>
                    <span class="comparison-change ${latestRecord.weight > initialBodyInfo.weight ? 'comparison-up' : 'comparison-down'}">
                      ${latestRecord.weight > initialBodyInfo.weight ? '+' : ''}${(latestRecord.weight - initialBodyInfo.weight).toFixed(1)}
                    </span>
                  </div>
                ` : ''}
              </div>
              
              <div class="comparison-item">
                <div class="comparison-label">体脂率 (%)</div>
                <div class="comparison-row">
                  <span>初始:</span>
                  <span class="comparison-value">${initialBodyInfo.bodyFatPercentage || '-'}</span>
                </div>
                <div class="comparison-row">
                  <span>最新:</span>
                  <span class="comparison-value">${latestRecord?.bodyFatPercentage || '-'}</span>
                </div>
                ${latestRecord?.bodyFatPercentage && initialBodyInfo.bodyFatPercentage ? `
                  <div class="comparison-row" style="border-bottom: none;">
                    <span>变化:</span>
                    <span class="comparison-change ${latestRecord.bodyFatPercentage < initialBodyInfo.bodyFatPercentage ? 'comparison-down' : 'comparison-up'}">
                      ${latestRecord.bodyFatPercentage > initialBodyInfo.bodyFatPercentage ? '+' : ''}${(latestRecord.bodyFatPercentage - initialBodyInfo.bodyFatPercentage).toFixed(1)}
                    </span>
                  </div>
                ` : ''}
              </div>
              
              <div class="comparison-item">
                <div class="comparison-label">骨骼肌率 (%)</div>
                <div class="comparison-row">
                  <span>初始:</span>
                  <span class="comparison-value">${initialBodyInfo.skeletalMusclePercentage || '-'}</span>
                </div>
                <div class="comparison-row">
                  <span>最新:</span>
                  <span class="comparison-value">${latestRecord?.skeletalMusclePercentage || '-'}</span>
                </div>
                ${latestRecord?.skeletalMusclePercentage && initialBodyInfo.skeletalMusclePercentage ? `
                  <div class="comparison-row" style="border-bottom: none;">
                    <span>变化:</span>
                    <span class="comparison-change ${latestRecord.skeletalMusclePercentage > initialBodyInfo.skeletalMusclePercentage ? 'comparison-up' : 'comparison-down'}">
                      ${latestRecord.skeletalMusclePercentage > initialBodyInfo.skeletalMusclePercentage ? '+' : ''}${(latestRecord.skeletalMusclePercentage - initialBodyInfo.skeletalMusclePercentage).toFixed(1)}
                    </span>
                  </div>
                ` : ''}
              </div>
            </div>
          `
        }
        
        // 训练效果记录
        if (records.length > 0) {
          html += `
            <h3 style="margin-top: 20px;">训练效果记录</h3>
            ${records.map(record => `
              <div class="record">
                <div class="record-header">
                  <span class="record-lesson">${record.date} · 第 ${record.lessonNumber} 节课</span>
                </div>
                ${record.weight || record.bodyFatPercentage || record.skeletalMusclePercentage ? `
                  <div style="padding: 8px 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px;">
                    ${record.weight ? `<span>体重: <strong>${record.weight} kg</strong></span>` : ''}
                    ${record.bodyFatPercentage ? `<span>体脂率: <strong>${record.bodyFatPercentage}%</strong></span>` : ''}
                    ${record.skeletalMusclePercentage ? `<span>骨骼肌率: <strong>${record.skeletalMusclePercentage}%</strong></span>` : ''}
                  </div>
                ` : ''}
                ${record.summary ? `<p style="margin-top: 8px; font-size: 13px;">${record.summary}</p>` : ''}
              </div>
            `).join('')}
          `
        }
        
        html += `
            </div>
        `
      }
    }

    // 评分
    if (options.includeRatings && student.ratings) {
      const { trust, execution, cognition, learning, loyalty } = student.ratings
      if (trust || execution || cognition || learning || loyalty) {
        html += `
          <div class="section">
            <h2>五维评分</h2>
            <div class="rating-grid">
              <div class="rating-item">
                <div class="rating-value">${trust || '-'}</div>
                <div class="rating-label">信任度</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${execution || '-'}</div>
                <div class="rating-label">执行力</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${cognition || '-'}</div>
                <div class="rating-label">认知度</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${learning || '-'}</div>
                <div class="rating-label">学习力</div>
              </div>
              <div class="rating-item">
                <div class="rating-value">${loyalty || '-'}</div>
                <div class="rating-label">忠诚度</div>
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
