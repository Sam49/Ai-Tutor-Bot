"use client"

import { RetroGrid } from "@/components/ui/hero-section"

import { useState } from "react"
import type { User } from "@/lib/auth"
import { ChatInterface } from "@/components/chat-interface"
import { SessionHistory } from "@/components/session-history"
import { UserProfile } from "@/components/user-profile"
import { QuizSystem } from "@/components/quiz-system"
import { LearningTracker } from "@/components/learning-tracker"
import { StudyPlanner } from "@/components/study-planner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, MessageSquare, History, UserIcon, LogOut, Menu, X, BarChart3, Calendar, Target } from "lucide-react"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface DashboardProps {
  user: User
}

type ActiveView = "chat" | "history" | "profile" | "quiz" | "tracker" | "planner"

export function Dashboard({ user }: DashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>("chat")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const { error } = await auth.signOut()
      if (error) throw error

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const menuItems = [
    {
      id: "chat" as ActiveView,
      label: "AI Tutor Chat",
      icon: MessageSquare,
      description: "Ask questions and get instant help",
    },
    {
      id: "quiz" as ActiveView,
      label: "Quiz System",
      icon: Target,
      description: "Create and take AI-generated quizzes",
    },
    {
      id: "tracker" as ActiveView,
      label: "Learning Analytics",
      icon: BarChart3,
      description: "Track your progress and performance",
    },
    {
      id: "planner" as ActiveView,
      label: "Study Planner",
      icon: Calendar,
      description: "AI-powered study plans",
    },
    {
      id: "history" as ActiveView,
      label: "Session History",
      icon: History,
      description: "Review past tutoring sessions",
    },
    {
      id: "profile" as ActiveView,
      label: "Profile",
      icon: UserIcon,
      description: "Manage your account settings",
    },
  ]

  const renderActiveView = () => {
    switch (activeView) {
      case "chat":
        return <ChatInterface user={user} />
      case "quiz":
        return <QuizSystem user={user} />
      case "tracker":
        return <LearningTracker user={user} />
      case "planner":
        return <StudyPlanner />
      case "history":
        return <SessionHistory user={user} />
      case "profile":
        return <UserProfile user={user} />
      default:
        return <ChatInterface user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Tutor
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.email || "Anonymous User"}
              </p>
              <Badge variant="secondary" className="text-xs mt-1">
                Demo Mode
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                  ${activeView === item.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleSignOut} className="w-full justify-start gap-3 bg-transparent">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-blue-600">AI Tutor</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none z-0">
            <RetroGrid opacity={0.15} />
          </div>
          <div className="relative z-10 h-full overflow-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  )
}
