'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, X, GripVertical, Edit2, Check, Trash2 } from 'lucide-react'
import type { Student, TrainingPlan, TrainingPhase, TrainingItem } from '@/lib/types'

interface TrainingPlanTabProps {
  student: Student
  onUpdateStudent: (updates: Partial<Student>) => void
}

const defaultPhase: TrainingPhase = {
  id: '',
  name: '',
  sessionsRange: [1, 10],
  items: [],
}

const defaultItem: TrainingItem = {
  id: '',
  name: '',
  goal: '',
  completed: false,
}

export function TrainingPlanTab({ student, onUpdateStudent }: TrainingPlanTabProps) {
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  
  // 确保 trainingPlan 和 phases 都有默认值
  const rawPlan = student.trainingPlan || {}
  const trainingPlan: TrainingPlan = {
    phases: Array.isArray(rawPlan.phases) ? rawPlan.phases : [],
    overallGoal: rawPlan.overallGoal || ''
  }

  const updatePlan = (updates: Partial<TrainingPlan>) => {
    onUpdateStudent({
      trainingPlan: { ...trainingPlan, ...updates }
    })
  }

  const addPhase = () => {
    const newPhase: TrainingPhase = {
      ...defaultPhase,
      id: crypto.randomUUID(),
      name: `阶段 ${trainingPlan.phases.length + 1}`,
      sessionsRange: [
        trainingPlan.phases.length > 0 
          ? (trainingPlan.phases[trainingPlan.phases.length - 1].sessionsRange[1] + 1) 
          : 1,
        trainingPlan.phases.length > 0 
          ? (trainingPlan.phases[trainingPlan.phases.length - 1].sessionsRange[1] + 10) 
          : 10,
      ],
    }
    updatePlan({ phases: [...trainingPlan.phases, newPhase] })
    setEditingPhaseId(newPhase.id)
  }

  const updatePhase = (phaseId: string, updates: Partial<TrainingPhase>) => {
    updatePlan({
      phases: trainingPlan.phases.map(p => 
        p.id === phaseId ? { ...p, ...updates } : p
      )
    })
  }

  const deletePhase = (phaseId: string) => {
    updatePlan({
      phases: trainingPlan.phases.filter(p => p.id !== phaseId)
    })
  }

  const addItem = (phaseId: string) => {
    const newItem: TrainingItem = {
      ...defaultItem,
      id: crypto.randomUUID(),
    }
    updatePhase(phaseId, {
      items: [...(trainingPlan.phases.find(p => p.id === phaseId)?.items || []), newItem]
    })
    setEditingItemId(newItem.id)
  }

  const updateItem = (phaseId: string, itemId: string, updates: Partial<TrainingItem>) => {
    const phase = trainingPlan.phases.find(p => p.id === phaseId)
    if (!phase) return
    updatePhase(phaseId, {
      items: phase.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
    })
  }

  const deleteItem = (phaseId: string, itemId: string) => {
    const phase = trainingPlan.phases.find(p => p.id === phaseId)
    if (!phase) return
    updatePhase(phaseId, {
      items: phase.items.filter(i => i.id !== itemId)
    })
  }

  return (
    <div className="space-y-6">
      {/* 整体训练目标 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">整体训练目标</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="输入学员的整体训练目标..."
            value={trainingPlan.overallGoal || ''}
            onChange={(e) => updatePlan({ overallGoal: e.target.value })}
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* 训练阶段列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">训练阶段</h3>
          <Button size="sm" variant="outline" onClick={addPhase}>
            <Plus className="w-4 h-4 mr-1" />
            添加阶段
          </Button>
        </div>

        {trainingPlan.phases.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>暂无训练阶段</p>
              <p className="text-sm mt-1">点击上方按钮添加第一个训练阶段</p>
            </CardContent>
          </Card>
        ) : (
          trainingPlan.phases.map((phase, phaseIndex) => (
            <Card key={phase.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    {editingPhaseId === phase.id ? (
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                        className="h-8 w-40"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{phase.name}</span>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      第 {phase.sessionsRange[0]} - {phase.sessionsRange[1]} 节课
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {editingPhaseId === phase.id ? (
                      <>
                        <div className="flex items-center gap-1 mr-2">
                          <Input
                            type="number"
                            value={phase.sessionsRange[0]}
                            onChange={(e) => updatePhase(phase.id, { 
                              sessionsRange: [parseInt(e.target.value) || 1, phase.sessionsRange[1]] 
                            })}
                            className="h-7 w-14 text-xs"
                            min={1}
                          />
                          <span className="text-xs text-muted-foreground">-</span>
                          <Input
                            type="number"
                            value={phase.sessionsRange[1]}
                            onChange={(e) => updatePhase(phase.id, { 
                              sessionsRange: [phase.sessionsRange[0], parseInt(e.target.value) || 10] 
                            })}
                            className="h-7 w-14 text-xs"
                            min={phase.sessionsRange[0]}
                          />
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => setEditingPhaseId(null)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0"
                        onClick={() => setEditingPhaseId(phase.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deletePhase(phase.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* 训练项目列表 */}
                <div className="space-y-2">
                  {phase.items.map((item, itemIndex) => (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 group"
                    >
                      <div className="flex-1 space-y-2">
                        {editingItemId === item.id ? (
                          <>
                            <Input
                              placeholder="训练项目名称"
                              value={item.name}
                              onChange={(e) => updateItem(phase.id, item.id, { name: e.target.value })}
                              className="h-8"
                              autoFocus
                            />
                            <Input
                              placeholder="训练目标 (可选)"
                              value={item.goal || ''}
                              onChange={(e) => updateItem(phase.id, item.id, { goal: e.target.value })}
                              className="h-8"
                            />
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={(e) => updateItem(phase.id, item.id, { completed: e.target.checked })}
                                className="w-4 h-4 rounded"
                              />
                              <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                {item.name || '未命名项目'}
                              </span>
                            </div>
                            {item.goal && (
                              <p className="text-sm text-muted-foreground pl-6">{item.goal}</p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingItemId === item.id ? (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingItemId(null)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingItemId(item.id)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteItem(phase.id, item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full border-dashed border mt-2"
                    onClick={() => addItem(phase.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加训练项目
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
