'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Student, Session, SessionRecord, RenewalRecord, RatingDimensions, TrainingPlan, StudentPhotos, TrainingEffect } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const STUDENTS_KEY = 'coach-students'
const SESSIONS_KEY = 'coach-sessions'
const SESSION_RECORDS_KEY = 'coach-session-records'

// 转换函数：SessionRecord
function dbSessionRecordToApp(db: Record<string, unknown>): SessionRecord {
  return {
    id: db.id as string,
    studentId: db.student_id as string,
    lessonNumber: db.lesson_number as number,
    date: db.date as string,
    trainingItems: (db.training_items as SessionRecord['trainingItems']) || [],
    overallStatus: db.overall_status as string || '',
    statusNote: db.status_note as string || '',
    coachMemo: db.coach_memo as string || '',
    includeMemoInPdf: db.include_memo_in_pdf as boolean || false,
  }
}

function appSessionRecordToDb(record: SessionRecord) {
  return {
    id: record.id,
    student_id: record.studentId,
    lesson_number: record.lessonNumber,
    date: record.date || null,
    training_items: record.trainingItems,
    overall_status: record.overallStatus,
    status_note: record.statusNote,
    coach_memo: record.coachMemo,
    include_memo_in_pdf: record.includeMemoInPdf,
  }
}

// 转换函数：数据库格式 -> 应用格式
function dbStudentToApp(db: Record<string, unknown>): Student {
  return {
    id: db.id as string,
    name: db.name as string,
    phone: db.phone as string || '',
    wechat: db.wechat as string || '',
    totalSessions: db.total_sessions as number,
    completedSessions: 0, // 从sessions计算
    totalFee: Number(db.total_fee),
    sessionPrice: Number(db.session_price),
    venueFee: Number(db.venue_fee),
    sessionIncome: Number(db.session_income),
    source: db.source as string,
    trainingBackground: db.training_background as string,
    ratings: db.ratings as RatingDimensions || {},
    status: db.status as 'active' | 'paused' | 'ended',
    pausedAt: db.paused_at as string,
    endedAt: db.ended_at as string,
    refundAmount: db.refund_amount ? Number(db.refund_amount) : undefined,
    refundAt: db.refund_at as string,
    renewalHistory: (db.renewal_history as RenewalRecord[]) || [],
    trainingPlanPdf: db.training_plan_pdf as string,
    contractPdf: db.contract_pdf as string,
    createdAt: db.created_at as string,
    trainingPlan: db.training_plan as TrainingPlan || { phases: [], overallGoal: '' },
    photos: db.photos as StudentPhotos || { beforePhotos: [], afterPhotos: [], progressPhotos: [] },
    trainingEffect: db.training_effect as TrainingEffect || {},
  }
}

function dbSessionToApp(db: Record<string, unknown>): Session {
  return {
    id: db.id as string,
    studentId: db.student_id as string,
    date: db.date as string,
    time: db.time as string,
    location: db.location as string,
    status: db.status as 'scheduled' | 'completed' | 'cancelled',
    notes: db.notes as string,
    createdAt: db.created_at as string,
  }
}

// 转换函数：应用格式 -> 数据库格式
function appStudentToDb(app: Student): Record<string, unknown> {
  return {
    id: app.id,
    name: app.name,
    phone: app.phone || null,
    wechat: app.wechat || null,
    total_sessions: app.totalSessions,
    total_fee: app.totalFee,
    session_price: app.sessionPrice,
    venue_fee: app.venueFee,
    session_income: app.sessionIncome,
    source: app.source || null,
    training_background: app.trainingBackground || null,
    ratings: app.ratings || {},
    status: app.status || 'active',
    paused_at: app.pausedAt || null,
    ended_at: app.endedAt || null,
    refund_amount: app.refundAmount || null,
    refund_at: app.refundAt || null,
    renewal_history: app.renewalHistory || [],
    training_plan_pdf: app.trainingPlanPdf || null,
    contract_pdf: app.contractPdf || null,
    training_plan: app.trainingPlan || {},
    photos: app.photos || { beforePhotos: [], afterPhotos: [], progressPhotos: [] },
    training_effect: app.trainingEffect || {},
  }
}

function appSessionToDb(app: Session): Record<string, unknown> {
  return {
    id: app.id,
    student_id: app.studentId,
    date: app.date,
    time: app.time,
    location: app.location || null,
    status: app.status || 'scheduled',
    notes: app.notes || null,
  }
}

export function useStore() {
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle')
  const supabase = useRef(createClient()).current
  const hasMigratedRef = useRef(false)

  // 从Supabase加载数据
  const loadFromSupabase = useCallback(async () => {
    try {
      const [studentsRes, sessionsRes, recordsRes] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: true }),
        supabase.from('sessions').select('*').order('created_at', { ascending: true }),
        supabase.from('session_records').select('*').order('lesson_number', { ascending: true }),
      ])

      if (studentsRes.error) throw studentsRes.error
      if (sessionsRes.error) throw sessionsRes.error
      // session_records 表可能不存在，忽略错误
      
      const loadedStudents = (studentsRes.data || []).map(dbStudentToApp)
      const loadedSessions = (sessionsRes.data || []).map(dbSessionToApp)
      const loadedRecords = (recordsRes.data || []).map(dbSessionRecordToApp)

      return { students: loadedStudents, sessions: loadedSessions, sessionRecords: loadedRecords }
    } catch (error) {
      console.error('[v0] Failed to load from Supabase:', error)
      return null
    }
  }, [supabase])

  // 迁移localStorage数据到Supabase
  const migrateLocalDataToSupabase = useCallback(async () => {
    if (hasMigratedRef.current) return

    const localStudents = localStorage.getItem(STUDENTS_KEY)
    const localSessions = localStorage.getItem(SESSIONS_KEY)

    if (!localStudents && !localSessions) {
      hasMigratedRef.current = true
      return
    }

    try {
      setSyncStatus('syncing')
      const studentsToMigrate: Student[] = localStudents ? JSON.parse(localStudents) : []
      const sessionsToMigrate: Session[] = localSessions ? JSON.parse(localSessions) : []

      if (studentsToMigrate.length > 0) {
        // 先检查云端是否已有数据
        const { data: existingStudents } = await supabase.from('students').select('id')
        const existingIds = new Set((existingStudents || []).map(s => s.id))

        // 只迁移不存在的学员
        const newStudents = studentsToMigrate.filter(s => !existingIds.has(s.id))
        
        if (newStudents.length > 0) {
          const { error } = await supabase
            .from('students')
            .upsert(newStudents.map(appStudentToDb), { onConflict: 'id' })
          if (error) throw error
        }
      }

      if (sessionsToMigrate.length > 0) {
        const { data: existingSessions } = await supabase.from('sessions').select('id')
        const existingIds = new Set((existingSessions || []).map(s => s.id))

        const newSessions = sessionsToMigrate.filter(s => !existingIds.has(s.id))
        
        if (newSessions.length > 0) {
          const { error } = await supabase
            .from('sessions')
            .upsert(newSessions.map(appSessionToDb), { onConflict: 'id' })
          if (error) throw error
        }
      }

      // 迁移成功后清除localStorage
      localStorage.removeItem(STUDENTS_KEY)
      localStorage.removeItem(SESSIONS_KEY)
      
      hasMigratedRef.current = true
      setSyncStatus('success')
      console.log('[v0] Migration completed successfully')
    } catch (error) {
      console.error('[v0] Migration failed:', error)
      setSyncStatus('error')
    }
  }, [supabase])

  // 初始化：加载数据
  useEffect(() => {
    async function init() {
      // 先尝试迁移本地数据
      await migrateLocalDataToSupabase()

  // 从Supabase加载数据
  const data = await loadFromSupabase()
  if (data) {
  setStudents(data.students)
  setSessions(data.sessions)
  setSessionRecords(data.sessionRecords || [])
  }
  setIsLoaded(true)
  }
    init()
  }, [loadFromSupabase, migrateLocalDataToSupabase])

  // Student operations with Supabase sync
  const addStudent = useCallback(async (student: Omit<Student, 'id' | 'completedSessions' | 'createdAt' | 'renewalHistory'>) => {
    const newStudent: Student = {
      ...student,
      id: crypto.randomUUID(),
      completedSessions: 0,
      renewalHistory: [],
      createdAt: new Date().toISOString(),
    }
    
    setStudents(prev => [...prev, newStudent])

    // Sync to Supabase
    const { error } = await supabase.from('students').insert(appStudentToDb(newStudent))
    if (error) console.error('[v0] Failed to sync student:', error)

    return newStudent
  }, [supabase])

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))

    // Sync to Supabase
    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.wechat !== undefined) dbUpdates.wechat = updates.wechat
    if (updates.totalSessions !== undefined) dbUpdates.total_sessions = updates.totalSessions
    if (updates.totalFee !== undefined) dbUpdates.total_fee = updates.totalFee
    if (updates.sessionPrice !== undefined) dbUpdates.session_price = updates.sessionPrice
    if (updates.venueFee !== undefined) dbUpdates.venue_fee = updates.venueFee
    if (updates.sessionIncome !== undefined) dbUpdates.session_income = updates.sessionIncome
    if (updates.source !== undefined) dbUpdates.source = updates.source
    if (updates.trainingBackground !== undefined) dbUpdates.training_background = updates.trainingBackground
    if (updates.ratings !== undefined) dbUpdates.ratings = updates.ratings
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.pausedAt !== undefined) dbUpdates.paused_at = updates.pausedAt
    if (updates.endedAt !== undefined) dbUpdates.ended_at = updates.endedAt
    if (updates.refundAmount !== undefined) dbUpdates.refund_amount = updates.refundAmount
    if (updates.refundAt !== undefined) dbUpdates.refund_at = updates.refundAt
    if (updates.renewalHistory !== undefined) dbUpdates.renewal_history = updates.renewalHistory
    if (updates.trainingPlanPdf !== undefined) dbUpdates.training_plan_pdf = updates.trainingPlanPdf
    if (updates.contractPdf !== undefined) dbUpdates.contract_pdf = updates.contractPdf

    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase.from('students').update(dbUpdates).eq('id', id)
    if (error) console.error('[v0] Failed to update student:', error)
  }, [supabase])

  const deleteStudent = useCallback(async (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id))
    setSessions(prev => prev.filter(s => s.studentId !== id))

    // Sync to Supabase (sessions will cascade delete)
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) console.error('[v0] Failed to delete student:', error)
  }, [supabase])

  // Renewal operation
  const renewStudent = useCallback(async (id: string, addedSessions: number, addedFee: number, addedVenueFee: number = 0) => {
    let updatedStudent: Student | null = null
    
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s
      
      const completed = sessions.filter(
        sess => sess.studentId === id && sess.status === 'completed'
      ).length
      const remaining = s.totalSessions - completed
      
      const renewalRecord: RenewalRecord = {
        id: crypto.randomUUID(),
        addedSessions,
        addedFee,
        addedVenueFee,
        remainingAtRenewal: remaining,
        date: new Date().toISOString(),
        confirmed: false,
      }
      
      updatedStudent = {
        ...s,
        renewalHistory: [...(s.renewalHistory || []), renewalRecord],
      }
      return updatedStudent
    }))

    if (updatedStudent) {
      const { error } = await supabase
        .from('students')
        .update({ renewal_history: (updatedStudent as Student).renewalHistory, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) console.error('[v0] Failed to sync renewal:', error)
    }
  }, [sessions, supabase])

  // Confirm renewal
  const confirmRenewal = useCallback(async (studentId: string, renewalId: string) => {
    let updatedStudent: Student | null = null

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      
      const renewal = (s.renewalHistory || []).find(r => r.id === renewalId)
      if (!renewal || renewal.confirmed) return s

      const newTotalSessions = s.totalSessions + renewal.addedSessions
      const newTotalFee = s.totalFee + renewal.addedFee
      const newSessionPrice = newTotalSessions > 0 ? newTotalFee / newTotalSessions : 0
      
      updatedStudent = {
        ...s,
        totalSessions: newTotalSessions,
        totalFee: newTotalFee,
        sessionPrice: newSessionPrice,
        venueFee: renewal.addedVenueFee || s.venueFee,
        sessionIncome: newSessionPrice - (renewal.addedVenueFee || s.venueFee),
        renewalHistory: (s.renewalHistory || []).map(r =>
          r.id === renewalId ? { ...r, confirmed: true } : r
        ),
      }
      return updatedStudent
    }))

    if (updatedStudent) {
      const { error } = await supabase
        .from('students')
        .update(appStudentToDb(updatedStudent))
        .eq('id', studentId)
      if (error) console.error('[v0] Failed to confirm renewal:', error)
    }
  }, [supabase])

  // Delete renewal
  const deleteRenewal = useCallback(async (studentId: string, renewalId: string) => {
    let updatedStudent: Student | null = null

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s

      const renewal = (s.renewalHistory || []).find(r => r.id === renewalId)
      if (!renewal) return s

      const updatedHistory = (s.renewalHistory || []).filter(r => r.id !== renewalId)

      if (renewal.confirmed) {
        const newTotalSessions = s.totalSessions - renewal.addedSessions
        const newTotalFee = s.totalFee - renewal.addedFee
        const newSessionPrice = newTotalSessions > 0 ? newTotalFee / newTotalSessions : 0

        const lastConfirmedRenewal = [...updatedHistory].reverse().find(r => r.confirmed)
        const currentVenueFee = lastConfirmedRenewal ? (lastConfirmedRenewal.addedVenueFee || s.venueFee) : s.venueFee
        
        updatedStudent = {
          ...s,
          totalSessions: Math.max(0, newTotalSessions),
          totalFee: Math.max(0, newTotalFee),
          sessionPrice: newSessionPrice,
          sessionIncome: newSessionPrice - currentVenueFee,
          renewalHistory: updatedHistory,
        }
        return updatedStudent
      }

      updatedStudent = {
        ...s,
        renewalHistory: updatedHistory,
      }
      return updatedStudent
    }))

    if (updatedStudent) {
      const { error } = await supabase
        .from('students')
        .update(appStudentToDb(updatedStudent))
        .eq('id', studentId)
      if (error) console.error('[v0] Failed to delete renewal:', error)
    }
  }, [supabase])

  // Update student ratings
  const updateStudentRatings = useCallback(async (studentId: string, ratings: RatingDimensions) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId
        ? { ...s, ratings, ratings_updated_at: new Date().toISOString() }
        : s
    ))

    const { error } = await supabase
      .from('students')
      .update({ ratings, updated_at: new Date().toISOString() })
      .eq('id', studentId)
    if (error) console.error('[v0] Failed to update ratings:', error)
  }, [supabase])

  // End course
  const endCourse = useCallback(async (studentId: string) => {
    let updatedStudent: Student | null = null

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      
      const completedCount = sessions.filter(
        session => session.studentId === studentId && session.status === 'completed'
      ).length
      
      updatedStudent = {
        ...s,
        totalSessions: completedCount,
        completedSessions: completedCount,
        status: 'ended' as const,
        endedAt: new Date().toISOString(),
      }
      return updatedStudent
    }))

    if (updatedStudent) {
      const { error } = await supabase
        .from('students')
        .update({
          total_sessions: (updatedStudent as Student).totalSessions,
          status: 'ended',
          ended_at: (updatedStudent as Student).endedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentId)
      if (error) console.error('[v0] Failed to end course:', error)
    }
  }, [sessions, supabase])

  // Pause course
  const pauseCourse = useCallback(async (studentId: string) => {
    const pausedAt = new Date().toISOString()
    
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      return { ...s, status: 'paused' as const, pausedAt }
    }))

    const { error } = await supabase
      .from('students')
      .update({ status: 'paused', paused_at: pausedAt, updated_at: new Date().toISOString() })
      .eq('id', studentId)
    if (error) console.error('[v0] Failed to pause course:', error)
  }, [supabase])

  // Restart course
  const restartCourse = useCallback(async (studentId: string, addedSessions: number, addedFee: number, addedVenueFee: number) => {
    let updatedStudent: Student | null = null

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      
      const newTotalSessions = s.totalSessions + addedSessions
      const newTotalFee = s.totalFee + addedFee
      const newSessionPrice = newTotalSessions > 0 ? newTotalFee / newTotalSessions : 0
      
      updatedStudent = {
        ...s,
        totalSessions: newTotalSessions,
        totalFee: newTotalFee,
        sessionPrice: newSessionPrice,
        venueFee: addedVenueFee || s.venueFee,
        sessionIncome: newSessionPrice - (addedVenueFee || s.venueFee),
        status: 'active' as const,
        endedAt: undefined,
        pausedAt: undefined,
      }
      return updatedStudent
    }))

    if (updatedStudent) {
      const { error } = await supabase
        .from('students')
        .update(appStudentToDb(updatedStudent))
        .eq('id', studentId)
      if (error) console.error('[v0] Failed to restart course:', error)
    }
  }, [supabase])

  // Refund course
  const refundCourse = useCallback(async (studentId: string, refundAmount: number) => {
    let updatedStudent: Student | null = null

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      
      const completedCount = sessions.filter(
        session => session.studentId === studentId && session.status === 'completed'
      ).length
      
      const actualFee = s.totalFee - refundAmount
      const newSessionPrice = completedCount > 0 ? actualFee / completedCount : 0
      const newSessionIncome = newSessionPrice - s.venueFee
      
      updatedStudent = {
        ...s,
        totalSessions: completedCount,
        totalFee: actualFee,
        sessionPrice: newSessionPrice,
        sessionIncome: newSessionIncome,
        refundAmount: refundAmount,
        refundAt: new Date().toISOString(),
        status: 'ended' as const,
        endedAt: new Date().toISOString(),
      }
      return updatedStudent
    }))

    if (updatedStudent) {
      const { error } = await supabase
        .from('students')
        .update(appStudentToDb(updatedStudent))
        .eq('id', studentId)
      if (error) console.error('[v0] Failed to refund course:', error)
    }
  }, [sessions, supabase])

  // Session operations
  const addSession = useCallback(async (session: Omit<Session, 'id' | 'createdAt'>) => {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setSessions(prev => [...prev, newSession])
    
    // Auto-restore paused student
    let studentToRestore: string | null = null
    setStudents(prev => prev.map(s => {
      if (s.id === session.studentId && s.status === 'paused') {
        studentToRestore = s.id
        return { ...s, status: 'active' as const, pausedAt: undefined }
      }
      return s
    }))

    // Sync session to Supabase
    const { error } = await supabase.from('sessions').insert(appSessionToDb(newSession))
    if (error) console.error('[v0] Failed to add session:', error)

    // Sync student restore if needed
    if (studentToRestore) {
      await supabase
        .from('students')
        .update({ status: 'active', paused_at: null, updated_at: new Date().toISOString() })
        .eq('id', studentToRestore)
    }
    
    return newSession
  }, [supabase])

  const updateSession = useCallback(async (id: string, updates: Partial<Session>) => {
    setSessions(prev => {
      const oldSession = prev.find(s => s.id === id)
      const newSessions = prev.map(s => s.id === id ? { ...s, ...updates } : s)
      
      if (oldSession && oldSession.status === 'planned' && updates.status === 'completed') {
        setStudents(prevStudents => 
          prevStudents.map(student => 
            student.id === oldSession.studentId 
              ? { ...student, completedSessions: student.completedSessions + 1 }
              : student
          )
        )
      }
      
      return newSessions
    })

    const dbUpdates: Record<string, unknown> = {}
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.time !== undefined) dbUpdates.time = updates.time
    if (updates.location !== undefined) dbUpdates.location = updates.location
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes

    const { error } = await supabase.from('sessions').update(dbUpdates).eq('id', id)
    if (error) console.error('[v0] Failed to update session:', error)
  }, [supabase])

  const deleteSession = useCallback(async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))

    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) console.error('[v0] Failed to delete session:', error)
  }, [supabase])

  const getStudent = useCallback((id: string) => {
    return students.find(s => s.id === id)
  }, [students])

  const getStudentSessions = useCallback((studentId: string) => {
    return sessions.filter(s => s.studentId === studentId)
  }, [sessions])

  const getSessionsInRange = useCallback((startDate: string, endDate: string) => {
    return sessions.filter(s => s.date >= startDate && s.date <= endDate)
  }, [sessions])

  const exportData = useCallback(() => {
    const data = {
      students,
      sessions,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coach-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [students, sessions])

  const importData = useCallback(async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.students && Array.isArray(data.students)) {
        setStudents(data.students)
        // Sync all students to Supabase
        for (const student of data.students) {
          await supabase.from('students').upsert(appStudentToDb(student), { onConflict: 'id' })
        }
      }
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions)
        // Sync all sessions to Supabase
        for (const session of data.sessions) {
          await supabase.from('sessions').upsert(appSessionToDb(session), { onConflict: 'id' })
        }
      }
      return true
    } catch {
      return false
    }
  }, [supabase])

  const getCompletedSessions = useCallback(() => {
    return sessions.filter(s => s.status === 'completed')
  }, [sessions])

  const getTotalRevenue = useCallback(() => {
    return getCompletedSessions().reduce((total, session) => {
      const student = getStudent(session.studentId)
      return total + (student?.sessionPrice || 0)
    }, 0)
  }, [getCompletedSessions, getStudent])

  const getTotalProfit = useCallback(() => {
    return getCompletedSessions().reduce((total, session) => {
      const student = getStudent(session.studentId)
      if (!student) return total
      return total + (student.sessionIncome || (student.sessionPrice - student.venueFee))
    }, 0)
  }, [getCompletedSessions, getStudent])

  // Session Records 相关
  const getStudentSessionRecords = useCallback((studentId: string) => {
    return sessionRecords.filter(r => r.studentId === studentId)
  }, [sessionRecords])

  const updateSessionRecord = useCallback(async (record: SessionRecord) => {
    setSessionRecords(prev => {
      const exists = prev.some(r => r.id === record.id)
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r)
      }
      return [...prev, record]
    })
    // Sync to Supabase
    await supabase.from('session_records').upsert(appSessionRecordToDb(record), { onConflict: 'id' })
  }, [supabase])

  const deleteSessionRecord = useCallback(async (recordId: string) => {
    setSessionRecords(prev => prev.filter(r => r.id !== recordId))
    await supabase.from('session_records').delete().eq('id', recordId)
  }, [supabase])

  return {
    students,
    sessions,
    sessionRecords,
    isLoaded,
    syncStatus,
    addStudent,
    updateStudent,
    deleteStudent,
    renewStudent,
    confirmRenewal,
    deleteRenewal,
    updateStudentRatings,
    endCourse,
    pauseCourse,
    restartCourse,
    refundCourse,
    addSession,
    updateSession,
    deleteSession,
    getStudent,
    getStudentSessions,
    getSessionsInRange,
    getStudentSessionRecords,
    updateSessionRecord,
    deleteSessionRecord,
    exportData,
    importData,
    getCompletedSessions,
    getTotalRevenue,
    getTotalProfit,
  }
}
