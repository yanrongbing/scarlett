'use client'

import { cn } from '@/lib/utils'
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Download, 
  Upload,
  Bell,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onExport: () => void
  onImport: () => void
}

const navItems = [
  { id: 'overview', label: '情况总览', icon: BarChart3 },
  { id: 'students', label: '学员管理', icon: Users },
  { id: 'schedule', label: '训练课表', icon: Calendar },
  { id: 'risk', label: '重要提醒', icon: Bell },
]

export function Sidebar({ activeTab, onTabChange, onExport, onImport }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">姜贝果学员课程管理</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-sidebar-foreground"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <div className="pt-4 border-t border-sidebar-border flex gap-2">
              <button
                onClick={() => {
                  onExport()
                  setIsMobileMenuOpen(false)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                导入
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const content = event.target?.result as string
                        onImport()
                        const importEvent = new CustomEvent('importData', { detail: content })
                        window.dispatchEvent(importEvent)
                      }
                      reader.readAsText(file)
                    }
                    setIsMobileMenuOpen(false)
                  }}
                />
              </label>
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed left-0 top-0 bottom-0">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-semibold text-sidebar-foreground">姜贝果学员课程管理</h1>
          <p className="text-sm text-muted-foreground mt-1">学员与课程管理</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    activeTab === item.id
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Download className="w-5 h-5" />
            导出数据
          </button>
          <label className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            导入数据
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const content = event.target?.result as string
                    onImport()
                    const importEvent = new CustomEvent('importData', { detail: content })
                    window.dispatchEvent(importEvent)
                  }
                  reader.readAsText(file)
                }
              }}
            />
          </label>
        </div>
      </aside>
    </>
  )
}
