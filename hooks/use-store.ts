'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Student, Session, RenewalRecord, RatingDimensions } from '@/lib/types'

const STUDENTS_KEY = 'coach-students'
const SESSIONS_KEY = 'coach-sessions'

export function useStore() {
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    const storedStudents = localStorage.getItem(STUDENTS_KEY)
    const storedSessions = localStorage.getItem(SESSIONS_KEY)
    
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents))
    }
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions))
    }
    setIsLoaded(true)
  }, [])

  // Save students to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
    }
  }, [students, isLoaded])

  // Save sessions to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
    }
  }, [sessions, isLoaded])

  // Student operations
  const addStudent = useCallback((student: Omit<Student, 'id' | 'completedSessions' | 'createdAt' | 'renewalHistory'>) => {
    const newStudent: Student = {
      ...student,
      id: crypto.randomUUID(),
      completedSessions: 0,
      renewalHistory: [],
      createdAt: new Date().toISOString(),
    }
    setStudents(prev => [...prev, newStudent])
    return newStudent
  }, [])

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const deleteStudent = useCallback((id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id))
    setSessions(prev => prev.filter(s => s.studentId !== id))
  }, [])

  // Renewal operation - add more sessions without creating new contract
  const renewStudent = useCallback((id: string, addedSessions: number, addedFee: number, addedVenueFee: number = 0) => {
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
      
      // Don't add to actual totals yet - only when confirmed
      return {
        ...s,
        renewalHistory: [...(s.renewalHistory || []), renewalRecord],
      }
    }))
  }, [sessions])

  // Confirm renewal - move from pending to actual
  const confirmRenewal = useCallback((studentId: string, renewalId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      
      const renewal = (s.renewalHistory || []).find(r => r.id === renewalId)
      if (!renewal || renewal.confirmed) return s

      const newTotalSessions = s.totalSessions + renewal.addedSessions
      const newTotalFee = s.totalFee + renewal.addedFee
      const newSessionPrice = newTotalSessions > 0 ? newTotalFee / newTotalSessions : 0
      
      return {
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
    }))
  }, [])

  // Delete renewal - rollback if confirmed, just remove if pending
  const deleteRenewal = useCallback((studentId: string, renewalId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s

      const renewal = (s.renewalHistory || []).find(r => r.id === renewalId)
      if (!renewal) return s

      const updatedHistory = (s.renewalHistory || []).filter(r => r.id !== renewalId)

      // If confirmed, rollback totalSessions and totalFee
      if (renewal.confirmed) {
        const newTotalSessions = s.totalSessions - renewal.addedSessions
        const newTotalFee = s.totalFee - renewal.addedFee
        const newSessionPrice = newTotalSessions > 0 ? newTotalFee / newTotalSessions : 0

        // Recalculate sessionIncome from remaining confirmed data
        // Use the latest venue fee from the most recent confirmed renewal, or original
        const lastConfirmedRenewal = [...updatedHistory].reverse().find(r => r.confirmed)
        const currentVenueFee = lastConfirmedRenewal ? (lastConfirmedRenewal.addedVenueFee || s.venueFee) : s.venueFee
        
        return {
          ...s,
          totalSessions: Math.max(0, newTotalSessions),
          totalFee: Math.max(0, newTotalFee),
          sessionPrice: newSessionPrice,
          sessionIncome: newSessionPrice - currentVenueFee,
          renewalHistory: updatedHistory,
        }
      }

      // If pending, just remove from history (no impact on totals)
      return {
        ...s,
        renewalHistory: updatedHistory,
      }
    }))
  }, [])

  // Update student ratings
  const updateStudentRatings = useCallback((studentId: string, ratings: RatingDimensions) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId
        ? {
            ...s,
            ratings,
            ratings_updated_at: new Date().toISOString(),
          }
        : s
    ))
  }, [])

  // End course - mark student as ended (set totalSessions = completedSessions)
  const endCourse = useCallback((studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      
      // Count actual completed sessions
      const completedCount = sessions.filter(
        session => session.studentId === studentId && session.status === 'completed'
      ).length
      
      return {
        ...s,
        totalSessions: completedCount, // Set total to completed, making remaining = 0
        completedSessions: completedCount,
      }
    }))
  }, [sessions])

  // Session operations
  const addSession = useCallback((session: Omit<Session, 'id' | 'createdAt'>) => {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setSessions(prev => [...prev, newSession])
    return newSession
  }, [])

  const updateSession = useCallback((id: string, updates: Partial<Session>) => {
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
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

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

  const importData = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.students && Array.isArray(data.students)) {
        setStudents(data.students)
      }
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions)
      }
      return true
    } catch {
      return false
    }
  }, [])

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

  return {
    students,
    sessions,
    isLoaded,
    addStudent,
    updateStudent,
    deleteStudent,
    renewStudent,
    confirmRenewal,
    deleteRenewal,
    updateStudentRatings,
    endCourse,
    addSession,
    updateSession,
    deleteSession,
    getStudent,
    getStudentSessions,
    getSessionsInRange,
    exportData,
    importData,
    getCompletedSessions,
    getTotalRevenue,
    getTotalProfit,
  }
}
