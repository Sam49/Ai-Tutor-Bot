"use client"

import type React from "react"

import {
  Brain,
  MessageSquare,
  Calendar,
  BarChart3,
  BookOpen,
  SettingsIcon,
  Moon,
  Sun,
  User,
  Menu,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const menuItems = [
  {
    title: "Dashboard",
    icon: Brain,
    id: "dashboard",
  },
  {
    title: "AI Chat",
    icon: MessageSquare,
    id: "chat",
  },
  {
    title: "Study Planner",
    icon: Calendar,
    id: "planner",
  },
  {
    title: "Progress",
    icon: BarChart3,
    id: "progress",
  },
  {
    title: "Subjects",
    icon: BookOpen,
    id: "subjects",
  },
  {
    title: "Settings",
    icon: SettingsIcon,
    id: "settings",
  },
]

interface AppSidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

export function AppSidebar({ activeView, setActiveView }: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const menuRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleItemClick = (id: string) => {
    setActiveView(id)
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusedIndex((prev) => {
            const nextIndex = prev < menuItems.length - 1 ? prev + 1 : 0
            setTimeout(() => menuRefs.current[nextIndex]?.focus(), 0)
            return nextIndex
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : menuItems.length - 1
            setTimeout(() => menuRefs.current[nextIndex]?.focus(), 0)
            return nextIndex
          })
          break
        case "Enter":
        case " ":
          e.preventDefault()
          if (focusedIndex >= 0) {
            setActiveView(menuItems[focusedIndex].id)
          }
          break
        case "Escape":
          e.preventDefault()
          menuRefs.current[focusedIndex]?.blur()
          setFocusedIndex(-1)
          break
      }
    },
    [focusedIndex, setActiveView],
  )

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Mobile Sidebar Overlay */}
        {isMobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-72 bg-background border-r border-border shadow-xl z-50 md:hidden">
              {/* Mobile Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-primary" />
                  <span className="font-bold text-lg">AI Learning</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 py-4">
                <ul className="space-y-2 px-3">
                  {menuItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleItemClick(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-lg
                          transition-all duration-200 ease-in-out
                          hover:bg-accent hover:text-accent-foreground
                          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                          ${
                            activeView === item.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }
                        `}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Mobile Footer */}
              <div className="border-t border-border p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full justify-start gap-3"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </Button>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  // Desktop Sidebar
  return (
    <div
      className={`
        fixed left-0 top-0 h-full bg-background border-r border-border shadow-lg z-50
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isHovered ? "w-72" : "w-20"}
        hover:shadow-xl hidden md:block
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div
            className={`
              transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap
              ${isHovered ? "opacity-100 max-w-none delay-100" : "opacity-0 max-w-0"}
            `}
          >
            <span className="font-bold text-lg">AI Learning</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-3">
          {menuItems.map((item, index) => (
            <li key={item.id}>
              <button
                ref={(el) => (menuRefs.current[index] = el)}
                onClick={() => setActiveView(item.id)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg
                  transition-all duration-200 ease-in-out
                  hover:bg-accent hover:text-accent-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                  focus:bg-accent focus:text-accent-foreground
                  ${
                    activeView === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-label={item.title}
                aria-current={activeView === item.id ? "page" : undefined}
                tabIndex={0}
              >
                <div className="flex-shrink-0 flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <span
                  className={`
                    transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap
                    ${isHovered ? "opacity-100 max-w-none delay-100" : "opacity-0 max-w-0"}
                  `}
                >
                  {item.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border">
        {/* User Profile */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div
              className={`
                transition-all duration-200 ease-in-out overflow-hidden
                ${isHovered ? "opacity-100 max-w-none delay-100" : "opacity-0 max-w-0"}
              `}
            >
              <div className="text-sm font-medium whitespace-nowrap">Learning User</div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">learner@example.com</div>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`
              w-full justify-start gap-3 px-3 py-2 h-auto
              hover:bg-accent hover:text-accent-foreground
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
              transition-all duration-200
            `}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            tabIndex={0}
          >
            <div className="flex-shrink-0 flex items-center justify-center">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </div>
            <span
              className={`
                transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap
                ${isHovered ? "opacity-100 max-w-none delay-100" : "opacity-0 max-w-0"}
              `}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
