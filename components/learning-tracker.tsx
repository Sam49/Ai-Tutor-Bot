"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Clock, Target, Award, BookOpen, Brain, Trophy, AlertCircle } from "lucide-react"
import { database, type LearningProgress } from "@/lib/database"

interface LearningTrackerProps {
  user: User
}

export function LearningTracker({ user }: LearningTrackerProps) {
  const [progress, setProgress] = useState<LearningProgress[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user.id])

  const loadData = async () => {
    try {
      const [userProgress, userAnalytics] = await Promise.all([
        database.getUserLearningProgress(user.id),
        database.getUserAnalytics(user.id),
      ])
      setProgress(userProgress)
      setAnalytics(userAnalytics)
    } catch (error) {
      console.error("Error loading learning data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMasteryColor = (level: string) => {
    switch (level) {
      case "expert":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "advanced":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "intermediate":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "beginner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getMasteryProgress = (level: string) => {
    switch (level) {
      case "expert":
        return 100
      case "advanced":
        return 75
      case "intermediate":
        return 50
      case "beginner":
        return 25
      default:
        return 0
    }
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading learning analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Learning Data Yet</h3>
            <p className="text-muted-foreground">
              Start taking quizzes and chatting with the AI tutor to see your progress here
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Analytics</h1>
          <p className="text-muted-foreground">Track your progress and identify areas for improvement</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <TrendingUp className="h-4 w-4 mr-1" />
          Analytics Dashboard
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Quizzes</p>
                <p className="text-2xl font-bold">{analytics.totalQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{analytics.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Study Time</p>
                <p className="text-2xl font-bold">{Math.round(analytics.totalStudyTime / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Topics Studied</p>
                <p className="text-2xl font-bold">{analytics.topicsStudied}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score Trends
            </CardTitle>
            <CardDescription>Your quiz performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.scoreHistory.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{ fill: "#8884d8" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Topic Mastery Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Mastery Levels
            </CardTitle>
            <CardDescription>Distribution of your topic mastery</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analytics.topicMastery).map(([level, count]) => ({
                    name: level.charAt(0).toUpperCase() + level.slice(1),
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analytics.topicMastery).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Per Topic */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Study Time by Topic
          </CardTitle>
          <CardDescription>Time invested in each subject area</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.timePerTopic}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} minutes`, "Study Time"]} />
              <Bar dataKey="time" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Topic Progress Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Topic Progress
          </CardTitle>
          <CardDescription>Detailed breakdown of your learning progress by topic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No topic progress data available yet</p>
            </div>
          ) : (
            progress.map((item) => (
              <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{item.topic}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last activity: {new Date(item.last_activity).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getMasteryColor(item.mastery_level)}>{item.mastery_level}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mastery Progress</span>
                    <span>{getMasteryProgress(item.mastery_level)}%</span>
                  </div>
                  <Progress value={getMasteryProgress(item.mastery_level)} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Study Time</p>
                    <p className="font-medium">{item.total_time_spent} min</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quiz Attempts</p>
                    <p className="font-medium">{item.quiz_attempts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Best Score</p>
                    <p className="font-medium">{item.best_score}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average Score</p>
                    <p className="font-medium">{item.average_score}%</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Personalized suggestions based on your learning progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.averageScore < 70 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Focus on Fundamentals</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Your average score is below 70%. Consider reviewing basic concepts and taking more practice
                      quizzes in your weaker topics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {progress.some((p) => p.mastery_level === "beginner") && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Build Foundation</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You have beginner-level topics. Spend more time on these subjects:{" "}
                      {progress
                        .filter((p) => p.mastery_level === "beginner")
                        .map((p) => p.topic)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.totalStudyTime < 300 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">Increase Study Time</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Try to study for at least 30 minutes daily. Consistent practice leads to better retention and
                      improved scores.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.averageScore >= 85 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2">
                  <Trophy className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-800 dark:text-purple-200">Excellent Progress!</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      You're performing exceptionally well! Consider exploring advanced topics or helping others learn.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
