"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Keyboard, X } from "lucide-react"

interface KeyboardShortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ["Tab"], description: "Navigate through sidebar items", category: "Navigation" },
  { keys: ["↑", "↓"], description: "Move up/down in sidebar", category: "Navigation" },
  { keys: ["Enter", "Space"], description: "Activate focused item", category: "Navigation" },
  { keys: ["Escape"], description: "Clear focus", category: "Navigation" },
  { keys: ["Ctrl", "K"], description: "Open command palette", category: "General" },
  { keys: ["Ctrl", "D"], description: "Go to Dashboard", category: "Quick Access" },
  { keys: ["Ctrl", "C"], description: "Open AI Chat", category: "Quick Access" },
  { keys: ["Ctrl", "P"], description: "Open Study Planner", category: "Quick Access" },
  { keys: ["Ctrl", "R"], description: "View Progress", category: "Quick Access" },
  { keys: ["Ctrl", "S"], description: "Manage Subjects", category: "Quick Access" },
  { keys: ["Ctrl", ","], description: "Open Settings", category: "Quick Access" },
]

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with Ctrl+?
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault()
        setIsOpen(true)
      }
      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-background/80 backdrop-blur-sm border shadow-lg"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" />
      </Button>
    )
  }

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, KeyboardShortcut[]>,
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>Navigate efficiently with these keyboard shortcuts</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Press{" "}
              <Badge variant="outline" className="font-mono text-xs">
                Ctrl
              </Badge>{" "}
              +{" "}
              <Badge variant="outline" className="font-mono text-xs">
                /
              </Badge>{" "}
              to toggle this help
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
