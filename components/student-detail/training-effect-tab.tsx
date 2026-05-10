'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Image as ImageIcon, Plus, Calendar, Trash2 } from 'lucide-react'
import type { Student, StudentPhotos, TrainingEffect, ProgressPhoto } from '@/lib/types'

interface TrainingEffectTabProps {
  student: Student
  onUpdateStudent: (updates: Partial<Student>) => void
}

export function TrainingEffectTab({ student, onUpdateStudent }: TrainingEffectTabProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)
  const progressInputRef = useRef<HTMLInputElement>(null)

  const photos: StudentPhotos = student.photos || {
    beforePhotos: [],
    afterPhotos: [],
    progressPhotos: [],
  }

  const trainingEffect: TrainingEffect = student.trainingEffect || {
    summary: '',
    improvements: [],
    challenges: [],
    nextSteps: '',
  }

  const updatePhotos = (updates: Partial<StudentPhotos>) => {
    onUpdateStudent({
      photos: { ...photos, ...updates }
    })
  }

  const updateEffect = (updates: Partial<TrainingEffect>) => {
    onUpdateStudent({
      trainingEffect: { ...trainingEffect, ...updates }
    })
  }

  const handleImageUpload = (
    type: 'before' | 'after' | 'progress',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        
        if (type === 'before') {
          updatePhotos({ beforePhotos: [...photos.beforePhotos, dataUrl] })
        } else if (type === 'after') {
          updatePhotos({ afterPhotos: [...photos.afterPhotos, dataUrl] })
        } else {
          const newProgress: ProgressPhoto = {
            id: crypto.randomUUID(),
            url: dataUrl,
            date: new Date().toISOString().split('T')[0],
            note: '',
          }
          updatePhotos({ progressPhotos: [...photos.progressPhotos, newProgress] })
        }
      }
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  const removeBeforePhoto = (index: number) => {
    updatePhotos({ beforePhotos: photos.beforePhotos.filter((_, i) => i !== index) })
  }

  const removeAfterPhoto = (index: number) => {
    updatePhotos({ afterPhotos: photos.afterPhotos.filter((_, i) => i !== index) })
  }

  const removeProgressPhoto = (id: string) => {
    updatePhotos({ progressPhotos: photos.progressPhotos.filter(p => p.id !== id) })
  }

  const updateProgressPhoto = (id: string, updates: Partial<ProgressPhoto>) => {
    updatePhotos({
      progressPhotos: photos.progressPhotos.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    })
  }

  const addImprovement = () => {
    updateEffect({ improvements: [...trainingEffect.improvements, ''] })
  }

  const updateImprovement = (index: number, value: string) => {
    const newImprovements = [...trainingEffect.improvements]
    newImprovements[index] = value
    updateEffect({ improvements: newImprovements })
  }

  const removeImprovement = (index: number) => {
    updateEffect({ improvements: trainingEffect.improvements.filter((_, i) => i !== index) })
  }

  const addChallenge = () => {
    updateEffect({ challenges: [...trainingEffect.challenges, ''] })
  }

  const updateChallenge = (index: number, value: string) => {
    const newChallenges = [...trainingEffect.challenges]
    newChallenges[index] = value
    updateEffect({ challenges: newChallenges })
  }

  const removeChallenge = (index: number) => {
    updateEffect({ challenges: trainingEffect.challenges.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      {/* 训练前后对比照片 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">训练前后对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* 训练前照片 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">训练前</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => beforeInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  上传
                </Button>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload('before', e)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {photos.beforePhotos.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img 
                      src={url} 
                      alt={`训练前 ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={() => setPreviewImage(url)}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeBeforePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {photos.beforePhotos.length === 0 && (
                  <div 
                    className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50"
                    onClick={() => beforeInputRef.current?.click()}
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* 训练后照片 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">训练后</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => afterInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  上传
                </Button>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload('after', e)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {photos.afterPhotos.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img 
                      src={url} 
                      alt={`训练后 ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={() => setPreviewImage(url)}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeAfterPhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {photos.afterPhotos.length === 0 && (
                  <div 
                    className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50"
                    onClick={() => afterInputRef.current?.click()}
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 阶段性进展照片 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">阶段性进展照片</CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => progressInputRef.current?.click()}
            >
              <Plus className="w-4 h-4 mr-1" />
              添加照片
            </Button>
            <input
              ref={progressInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload('progress', e)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {photos.progressPhotos.length === 0 ? (
            <div 
              className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50"
              onClick={() => progressInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>点击上传阶段性进展照片</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {photos.progressPhotos.map((photo) => (
                <div key={photo.id} className="space-y-2">
                  <div className="relative group aspect-square">
                    <img 
                      src={photo.url} 
                      alt="进展照片"
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={() => setPreviewImage(photo.url)}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeProgressPhoto(photo.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <Input
                      type="date"
                      value={photo.date}
                      onChange={(e) => updateProgressPhoto(photo.id, { date: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <Input
                    placeholder="备注说明"
                    value={photo.note || ''}
                    onChange={(e) => updateProgressPhoto(photo.id, { note: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 训练效果总结 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">训练效果总结</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">总体评价</label>
            <Textarea
              placeholder="描述学员的整体训练效果..."
              value={trainingEffect.summary || ''}
              onChange={(e) => updateEffect({ summary: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* 主要进步 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">主要进步</CardTitle>
            <Button size="sm" variant="outline" onClick={addImprovement}>
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {trainingEffect.improvements.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              点击上方按钮记录学员的进步
            </div>
          ) : (
            <div className="space-y-2">
              {trainingEffect.improvements.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">+</Badge>
                  <Input
                    value={item}
                    onChange={(e) => updateImprovement(index, e.target.value)}
                    placeholder="描述进步点..."
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => removeImprovement(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 待改进问题 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">待改进问题</CardTitle>
            <Button size="sm" variant="outline" onClick={addChallenge}>
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {trainingEffect.challenges.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              点击上方按钮记录待改进的问题
            </div>
          ) : (
            <div className="space-y-2">
              {trainingEffect.challenges.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-warning/10 text-warning">!</Badge>
                  <Input
                    value={item}
                    onChange={(e) => updateChallenge(index, e.target.value)}
                    placeholder="描述待改进点..."
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => removeChallenge(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 下一步计划 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">下一步计划</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="描述接下来的训练计划和目标..."
            value={trainingEffect.nextSteps || ''}
            onChange={(e) => updateEffect({ nextSteps: e.target.value })}
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img 
            src={previewImage} 
            alt="预览" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
