"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { SettingsIcon, Download, Upload, Trash2, Sparkles } from "lucide-react"

interface AppSettings {
  dailyStudyGoal: number
  enableNotifications: boolean
  autoGeneratePlans: boolean
  theme: "light" | "dark" | "system"
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    dailyStudyGoal: 60,
    enableNotifications: true,
    autoGeneratePlans: false,
    theme: "system",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("app-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const saveSettings = () => {
    setIsLoading(true)
    try {
      localStorage.setItem("app-settings", JSON.stringify(settings))
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    try {
      const data = {
        subjects: JSON.parse(localStorage.getItem("learning-subjects") || "[]"),
        studyPlans: JSON.parse(localStorage.getItem("study-plans") || "[]"),
        chatHistory: JSON.parse(localStorage.getItem("chat-history") || "[]"),
        settings: settings,
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `learning-assistant-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Data exported",
        description: "Your learning data has been downloaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.subjects) localStorage.setItem("learning-subjects", JSON.stringify(data.subjects))
        if (data.studyPlans) localStorage.setItem("study-plans", JSON.stringify(data.studyPlans))
        if (data.chatHistory) localStorage.setItem("chat-history", JSON.stringify(data.chatHistory))
        if (data.settings) setSettings(data.settings)

        toast({
          title: "Data imported",
          description: "Your learning data has been restored successfully.",
        })

        // Refresh the page to load new data
        window.location.reload()
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid backup file. Please check the file and try again.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      localStorage.removeItem("learning-subjects")
      localStorage.removeItem("study-plans")
      localStorage.removeItem("chat-history")
      localStorage.removeItem("app-settings")

      toast({
        title: "Data cleared",
        description: "All learning data has been removed.",
      })

      // Reset settings to default
      setSettings({
        dailyStudyGoal: 60,
        enableNotifications: true,
        autoGeneratePlans: false,
        theme: "system",
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your learning assistant preferences</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <SettingsIcon className="h-4 w-4 mr-1" />
          Configuration
        </Badge>
      </div>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Configuration
          </CardTitle>
          <CardDescription>Your AI assistant is powered by Google Gemini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Gemini AI Integrated</h4>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Your AI tutor is powered by Google's advanced Gemini 2.0 Flash model for the best learning experience.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Model</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Gemini 2.0 Flash Experimental</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Status</div>
              <div className="text-xs text-green-600 dark:text-green-400">Active & Ready</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-generate study plans</Label>
              <p className="text-sm text-muted-foreground">Automatically create study plans when adding new subjects</p>
            </div>
            <Switch
              checked={settings.autoGeneratePlans}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoGeneratePlans: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Preferences</CardTitle>
          <CardDescription>Customize your learning experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="daily-goal">Daily Study Goal (minutes)</Label>
            <Input
              id="daily-goal"
              type="number"
              min="15"
              max="480"
              value={settings.dailyStudyGoal}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, dailyStudyGoal: Number.parseInt(e.target.value) || 60 }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable notifications</Label>
              <p className="text-sm text-muted-foreground">Get reminders about your study schedule and progress</p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableNotifications: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup, restore, or clear your learning data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={exportData} variant="outline" className="flex-1 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <div className="flex-1">
              <input type="file" accept=".json" onChange={importData} className="hidden" id="import-file" />
              <Button asChild variant="outline" className="w-full bg-transparent">
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </label>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={clearAllData} variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This will permanently delete all your subjects, study plans, and chat history
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
