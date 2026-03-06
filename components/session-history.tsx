"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageSquare,
  BookOpen,
  Trophy,
  Brain,
  Calendar,
  Clock,
  ArrowUpRight,
  Filter,
} from "lucide-react"
import { format } from "date-fns"
import { database, type ChatSession, type QuizAttempt } from "@/lib/database"
import type { User } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SessionHistoryProps {
  user: User
}

type SessionItem =
  | { type: "chat"; data: ChatSession; date: Date }
  | { type: "quiz"; data: QuizAttempt; date: Date }

export function SessionHistory({ user }: SessionHistoryProps) {
  const [history, setHistory] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "chat" | "quiz">("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [chats, quizzes] = await Promise.all([
        database.getChatSessions(user.id),
        database.getQuizAttempts(user.id),
      ])

      const combined: SessionItem[] = [
        ...chats.map((c) => ({ type: "chat" as const, data: c, date: new Date(c.updated_at) })),
        ...quizzes.map((q) => ({ type: "quiz" as const, data: q, date: new Date(q.completed_at) })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime())

      setHistory(combined)
    } catch (error) {
      console.error("Failed to load history:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(item => filter === "all" || item.type === filter)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Activity History
          </h1>
          <p className="text-muted-foreground mt-1">Review your past learning sessions</p>
        </div>
        <div className="flex gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-1 rounded-lg border">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            All
          </Button>
          <Button
            variant={filter === "chat" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("chat")}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Chats
          </Button>
          <Button
            variant={filter === "quiz" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("quiz")}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Quizzes
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity found. Start a chat or take a quiz to see it here!
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <Card
                key={`${item.type}-${item.data.id}`}
                className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm group overflow-hidden"
              >
                <div className={`h-1 w-full bg-gradient-to-r ${item.type === "chat" ? "from-purple-500 to-pink-500" : "from-green-500 to-emerald-500"
                  } opacity-0 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-full shrink-0 ${item.type === "chat"
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                    }`}>
                    {item.type === "chat" ? <MessageSquare className="h-6 w-6" /> : <Trophy className="h-6 w-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {item.type === "chat" ? "Study Session" : "Quiz Attempt"}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(item.date, "MMM d, h:mm a")}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold truncate hover:text-blue-600 transition-colors cursor-pointer">
                      {item.type === "chat" ? (item.data as ChatSession).title : "General Knowledge Quiz"}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.type === "chat"
                        ? `Focusing on ${(item.data as ChatSession).subject_id || "general topics"}`
                        : `Score: ${(item.data as QuizAttempt).percentage}% • ${(item.data as QuizAttempt).total_questions} Questions`
                      }
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {item.type === "quiz" && (
                      <div className="font-bold text-2xl text-green-600 dark:text-green-400">
                        {(item.data as QuizAttempt).percentage}%
                      </div>
                    )}
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
