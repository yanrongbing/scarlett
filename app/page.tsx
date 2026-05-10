'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/hooks/use-store'
import { Sidebar } from '@/components/sidebar'
import { OverviewView } from '@/components/overview-view'
import { StudentsView } from '@/components/students-view'
import { ScheduleView } from '@/components/schedule-view'
import { RiskView } from '@/components/risk-view'
import { StudentDetail } from '@/components/student-detail'
import { RenewalForm } from '@/components/renewal-form'
import { Loader2 } from 'lucide-react'
import type { Student, RatingDimensions } from '@/lib/types'

export default function CoachManagerPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [renewingStudent, setRenewingStudent] = useState<Student | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const store = useStore()

  // Handle import from sidebar
  useEffect(() => {
    const handleImport = (e: CustomEvent<string>) => {
      const success = store.importData(e.detail)
      if (success) {
        alert('数据导入成功！')
      } else {
        alert('数据导入失败，请检查文件格式。')
      }
    }

    window.addEventListener('importData', handleImport as EventListener)
    return () => window.removeEventListener('importData', handleImport as EventListener)
  }, [store])

  if (!store.isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show student detail page if selected
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onExport={store.exportData}
          onImport={() => {}}
        />
        <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-3 sm:p-4 lg:p-6">
            <StudentDetail
              student={selectedStudent}
              sessions={store.sessions}
              onBack={() => setSelectedStudent(null)}
              onEdit={() => {
                setActiveTab('students')
                setSelectedStudent(null)
              }}
              onUpdateRatings={(ratings: RatingDimensions) => {
                store.updateStudentRatings(selectedStudent.id, ratings)
              }}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExport={store.exportData}
        onImport={() => {}}
      />
      
      {/* Main content with responsive padding */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-3 sm:p-4 lg:p-6">
          {activeTab === 'overview' && (
            <OverviewView 
              students={store.students}
              sessions={store.sessions}
              getStudent={store.getStudent}
              onSelectStudent={setSelectedStudent}
            />
          )}
          
          {activeTab === 'students' && (
            <StudentsView 
              students={store.students}
              sessions={store.sessions}
              onAddStudent={store.addStudent}
              onUpdateStudent={store.updateStudent}
              onDeleteStudent={store.deleteStudent}
              onRenewStudent={store.renewStudent}
              onConfirmRenewal={store.confirmRenewal}
              onDeleteRenewal={store.deleteRenewal}
              onSelectStudent={setSelectedStudent}
            />
          )}
          
          {activeTab === 'schedule' && (
            <ScheduleView 
              students={store.students}
              sessions={store.sessions}
              onAddSession={store.addSession}
              onUpdateSession={store.updateSession}
              onDeleteSession={store.deleteSession}
              getStudent={store.getStudent}
            />
          )}
          
          {activeTab === 'risk' && (
            <RiskView 
              students={store.students}
              sessions={store.sessions}
              getStudent={store.getStudent}
              onRenewStudent={setRenewingStudent}
              onSelectStudent={setSelectedStudent}
            />
          )}
        </div>
      </main>

      {/* Renewal Form for Risk View */}
      <RenewalForm
        open={!!renewingStudent}
        onOpenChange={(open) => !open && setRenewingStudent(null)}
        student={renewingStudent}
        sessions={store.sessions}
        onRenew={store.renewStudent}
      />
    </div>
  )
}
