"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Calendar, Award, CheckCircle } from "lucide-react"

interface ProgressData {
  subject: string
  totalSessions: number
  completedSessions: number
  weeklyProgress: number[]
  lastActivity: string
  streak: number
}

export function ProgressTracker() {
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [overallStats, setOverallStats] = useState({
    totalStudyTime: 0,
    completedSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
  })

  useEffect(() => {
    // Load and calculate progress data
    const savedPlans = localStorage.getItem("study-plans")
    const savedSubjects = localStorage.getItem("learning-subjects")

    if (savedPlans) {
      const plans = JSON.parse(savedPlans)
      const progressData: ProgressData[] = plans.map((plan: any) => {
        const completedSessions = plan.schedule.filter((s: any) => s.completed).length
        const totalSessions = plan.schedule.length

        return {
          subject: plan.subject,
          totalSessions,
          completedSessions,
          weeklyProgress: [65, 70, 85, 90], // Mock weekly progress data
          lastActivity: "2024-01-10",
          streak: 5,
        }
      })

      setProgressData(progressData)

      // Calculate overall stats
      const totalCompleted = progressData.reduce((sum, data) => sum + data.completedSessions, 0)
      const totalStudyTime = progressData.reduce((sum, data) => sum + data.completedSessions * 60, 0) // Assume 60 min per session

      setOverallStats({
        totalStudyTime: Math.round(totalStudyTime / 60), // Convert to hours
        completedSessions: totalCompleted,
        currentStreak: 7,
        longestStreak: 12,
      })
    }
  }, [])

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default"
    if (percentage >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Tracker</h1>
          <p className="text-muted-foreground">Monitor your learning journey and achievements</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <BarChart3 className="h-4 w-4 mr-1" />
          Analytics
        </Badge>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalStudyTime}h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.longestStreak}</div>
            <p className="text-xs text-muted-foreground">Personal best</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Progress</CardTitle>
          <CardDescription>Detailed progress for each subject you're studying</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {progressData.map((data, index) => {
            const percentage = Math.round((data.completedSessions / data.totalSessions) * 100)

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{data.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {data.completedSessions} of {data.totalSessions} sessions completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getProgressBadgeVariant(percentage)}>{percentage}%</Badge>
                    <Badge variant="outline" className="text-xs">
                      {data.streak} day streak
                    </Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />

                {/* Weekly Progress Chart */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Weekly Progress</h4>
                  <div className="flex items-end gap-2 h-20">
                    {data.weeklyProgress.map((progress, weekIndex) => (
                      <div key={weekIndex} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-primary rounded-t" style={{ height: `${progress}%` }} />
                        <span className="text-xs text-muted-foreground mt-1">W{weekIndex + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Recent Achievements
          </CardTitle>
          <CardDescription>Celebrate your learning milestones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Award className="h-8 w-8 text-yellow-500" />
            <div>
              <h4 className="font-medium">Week Warrior</h4>
              <p className="text-sm text-muted-foreground">Completed 7 days of consistent study</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h4 className="font-medium">JavaScript Master</h4>
              <p className="text-sm text-muted-foreground">Completed 65% of JavaScript Fundamentals</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <h4 className="font-medium">Progress Maker</h4>
              <p className="text-sm text-muted-foreground">Improved average progress by 15% this week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {progressData.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Progress Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start studying with your AI-generated plans to see your progress here.
            </p>
            <Button variant="outline">Create Your First Study Plan</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
