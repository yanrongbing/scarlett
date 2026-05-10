'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Save, X, Upload, Image as ImageIcon } from 'lucide-react'
import type { Student, TrainingPlan, TrainingPhase, TrainingProject } from '@/lib/types'

interface TrainingPlanTabProps {
  student: Student
  onUpdateStudent?: (updates: Partial<Student>) => void
}

export function TrainingPlanTab({ student, onUpdateStudent }: TrainingPlanTabProps) {
  const [isEditingStrategy, setIsEditingStrategy] = useState(false)
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null)
  const [newPhase, setNewPhase] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const rawPlan = student.trainingPlan || {}
  const trainingPlan: TrainingPlan = {
    bodyInfo: rawPlan.bodyInfo || {},
    overallStrategy: rawPlan.overallStrategy || '',
    phases: Array.isArray(rawPlan.phases) ? rawPlan.phases : [],
  }

  const handleUpdatePlan = (updates: Partial<TrainingPlan>) => {
    if (!onUpdateStudent) return
    onUpdateStudent({
      trainingPlan: { ...trainingPlan, ...updates },
    })
  }

  const handleAddPhase = () => {
    const newPhaseObj: TrainingPhase = {
      id: Date.now().toString(),
      name: '新阶段',
      duration: '',
      sessionCount: 0,
      trainingProjects: [],
      dietSuggestions: '',
    }
    handleUpdatePlan({ phases: [...trainingPlan.phases, newPhaseObj] })
    setNewPhase(false)
  }

  const handleUpdatePhase = (phaseId: string, updates: Partial<TrainingPhase>) => {
    const updated = trainingPlan.phases.map(p =>
      p.id === phaseId ? { ...p, ...updates } : p
    )
    handleUpdatePlan({ phases: updated })
  }

  const handleDeletePhase = (phaseId: string) => {
    handleUpdatePlan({
      phases: trainingPlan.phases.filter(p => p.id !== phaseId),
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      handleUpdatePlan({
        bodyInfo: {
          ...trainingPlan.bodyInfo,
          bodyPhotoBase64: base64,
        },
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      {/* 身体信息部分 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">身体信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">年龄（岁）</Label>
              <Input
                type="number"
                value={trainingPlan.bodyInfo.age || ''}
                onChange={(e) =>
                  handleUpdatePlan({
                    bodyInfo: {
                      ...trainingPlan.bodyInfo,
                      age: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="25"
              />
            </div>
            <div>
              <Label className="text-sm">身高（cm）</Label>
              <Input
                type="number"
                value={trainingPlan.bodyInfo.height || ''}
                onChange={(e) =>
                  handleUpdatePlan({
                    bodyInfo: {
                      ...trainingPlan.bodyInfo,
                      height: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="180"
              />
            </div>
            <div>
              <Label className="text-sm">体重（kg）</Label>
              <Input
                type="number"
                value={trainingPlan.bodyInfo.weight || ''}
                onChange={(e) =>
                  handleUpdatePlan({
                    bodyInfo: {
                      ...trainingPlan.bodyInfo,
                      weight: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="75"
              />
            </div>
            <div>
              <Label className="text-sm">体脂率（%）</Label>
              <Input
                type="number"
                value={trainingPlan.bodyInfo.bodyFatPercentage || ''}
                onChange={(e) =>
                  handleUpdatePlan({
                    bodyInfo: {
                      ...trainingPlan.bodyInfo,
                      bodyFatPercentage: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="20"
              />
            </div>
            <div>
              <Label className="text-sm">骨骼肌率（%）</Label>
              <Input
                type="number"
                value={trainingPlan.bodyInfo.skeletalMusclePercentage || ''}
                onChange={(e) =>
                  handleUpdatePlan({
                    bodyInfo: {
                      ...trainingPlan.bodyInfo,
                      skeletalMusclePercentage: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="40"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm">训练目标</Label>
            <Input
              value={trainingPlan.bodyInfo.trainingGoal || ''}
              onChange={(e) =>
                handleUpdatePlan({
                  bodyInfo: {
                    ...trainingPlan.bodyInfo,
                    trainingGoal: e.target.value,
                  },
                })
              }
              placeholder="例如：增肌、减脂、体能提升..."
            />
          </div>
          <div>
            <Label className="text-sm">体态照片</Label>
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-1" />
                上传照片
              </Button>
              {trainingPlan.bodyInfo.bodyPhotoBase64 && (
                <span className="text-xs text-success">✓ 已上传</span>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            {trainingPlan.bodyInfo.bodyPhotoBase64 && (
              <div className="mt-3 rounded-lg overflow-hidden h-40 bg-muted flex items-center justify-center">
                <img
                  src={trainingPlan.bodyInfo.bodyPhotoBase64}
                  alt="体态照片"
                  className="max-h-full max-w-full object-cover"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 整体训练策略 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">整体训练策略</CardTitle>
          {!isEditingStrategy && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingStrategy(true)}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              编辑
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingStrategy ? (
            <div className="space-y-3">
              <textarea
                value={trainingPlan.overallStrategy}
                onChange={(e) => handleUpdatePlan({ overallStrategy: e.target.value })}
                placeholder="输入整体训练策略..."
                className="w-full h-32 p-3 border border-border rounded-lg resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingStrategy(false)}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEditingStrategy(false)}
                >
                  <Save className="w-3 h-3 mr-1" />
                  保存
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted rounded-lg min-h-[120px]">
              <p className="text-sm whitespace-pre-wrap">
                {trainingPlan.overallStrategy || '暂无'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 训练阶段规划 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">训练阶段规划</CardTitle>
          {!newPhase && (
            <Button
              size="sm"
              onClick={() => setNewPhase(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              新增阶段
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {trainingPlan.phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isEditing={editingPhaseId === phase.id}
              onEdit={() => setEditingPhaseId(phase.id)}
              onUpdate={(updates) => handleUpdatePhase(phase.id, updates)}
              onDelete={() => handleDeletePhase(phase.id)}
            />
          ))}

          {newPhase && (
            <div className="p-4 border-2 border-dashed border-border rounded-lg">
              <Button
                size="sm"
                className="w-full"
                onClick={handleAddPhase}
              >
                <Plus className="w-3 h-3 mr-1" />
                确认新增
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PhaseCard({
  phase,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
}: {
  phase: TrainingPhase
  isEditing: boolean
  onEdit: () => void
  onUpdate: (updates: Partial<TrainingPhase>) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(phase.name)
  const [duration, setDuration] = useState(phase.duration)
  const [sessionCount, setSessionCount] = useState(phase.sessionCount.toString())
  const [dietSuggestions, setDietSuggestions] = useState(phase.dietSuggestions)
  const [newProject, setNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  const handleSave = () => {
    onUpdate({
      name,
      duration,
      sessionCount: parseInt(sessionCount) || 0,
      dietSuggestions,
    })
    onEdit()
  }

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    const project: TrainingProject = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDesc,
    }
    onUpdate({
      trainingProjects: [...phase.trainingProjects, project],
    })
    setNewProjectName('')
    setNewProjectDesc('')
    setNewProject(false)
  }

  const handleDeleteProject = (projectId: string) => {
    onUpdate({
      trainingProjects: phase.trainingProjects.filter(p => p.id !== projectId),
    })
  }

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">阶段名称</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">时长</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="例如: 4周"
              />
            </div>
            <div>
              <Label className="text-sm">对应节数</Label>
              <Input
                type="number"
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value)}
              />
            </div>
          </div>

          {/* 训练项目 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">训练项目</Label>
              {!newProject && (
                <Button size="sm" variant="outline" onClick={() => setNewProject(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  添加
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {phase.trainingProjects.map((proj) => (
                <div key={proj.id} className="p-3 bg-muted rounded flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{proj.name}</p>
                    <p className="text-xs text-muted-foreground">{proj.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProject(proj.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {newProject && (
                <div className="p-3 border border-dashed rounded space-y-2">
                  <Input
                    placeholder="项目名称"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="text-sm"
                  />
                  <textarea
                    placeholder="项目描述"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full h-16 p-2 border border-border rounded text-sm resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setNewProject(false)}>
                      取消
                    </Button>
                    <Button size="sm" onClick={handleAddProject}>
                      保存
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 饮食建议 */}
          <div>
            <Label className="text-sm">饮食建议</Label>
            <textarea
              value={dietSuggestions}
              onChange={(e) => setDietSuggestions(e.target.value)}
              placeholder="输入饮食建议..."
              className="w-full h-20 p-2 border border-border rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => onEdit()}>
              <X className="w-3 h-3 mr-1" />
              取消
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-3 h-3 mr-1" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-medium">{phase.name}</h4>
            <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
              <span>时长: {phase.duration}</span>
              <span>节数: {phase.sessionCount}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit()}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {phase.trainingProjects.length > 0 && (
          <div className="mt-3 pt-3 border-t text-sm space-y-2">
            <p className="font-medium text-xs text-muted-foreground">训练项目:</p>
            {phase.trainingProjects.map((proj) => (
              <div key={proj.id}>
                <p className="font-medium">{proj.name}</p>
                <p className="text-xs text-muted-foreground">{proj.description}</p>
              </div>
            ))}
          </div>
        )}

        {phase.dietSuggestions && (
          <div className="mt-3 pt-3 border-t text-sm">
            <p className="font-medium text-xs text-muted-foreground mb-1">饮食建议:</p>
            <p className="text-xs">{phase.dietSuggestions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
