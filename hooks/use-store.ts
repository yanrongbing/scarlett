'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Student, Session, RenewalRecord, CourseType, StudentSource } from '@/lib/types'

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
  const renewStudent = useCallback((id: string, addedSessions: number, addedFee: number) => {
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
        remainingAtRenewal: remaining,
        date: new Date().toISOString(),
      }
      
      const newTotalSessions = s.totalSessions + addedSessions
      const newTotalFee = s.totalFee + addedFee
      const newSessionPrice = newTotalSessions > 0 ? newTotalFee / newTotalSessions : 0
      
      return {
        ...s,
        totalSessions: newTotalSessions,
        totalFee: newTotalFee,
        sessionPrice: newSessionPrice,
        renewalHistory: [...(s.renewalHistory || []), renewalRecord],
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
      
      // If marking as completed, update student's completedSessions
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

  // Get student by ID
  const getStudent = useCallback((id: string) => {
    return students.find(s => s.id === id)
  }, [students])

  // Get sessions for a student
  const getStudentSessions = useCallback((studentId: string) => {
    return sessions.filter(s => s.studentId === studentId)
  }, [sessions])

  // Get sessions for a date range
  const getSessionsInRange = useCallback((startDate: string, endDate: string) => {
    return sessions.filter(s => s.date >= startDate && s.date <= endDate)
  }, [sessions])

  // Export data
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

  // Import data
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

  // Calculate stats
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
      return total + (student.sessionPrice - student.venueFee)
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
