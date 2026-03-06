"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Brain, Users, CloudLightning, MoreVertical, FileText, Play, Trash2, Trophy, Clock, Target, BookOpen, BarChart3, Sparkles, CheckCircle, XCircle } from "lucide-react"
import { database, type Quiz, type QuizAttempt } from "@/lib/database"

interface QuizSystemProps {
  user: User
}

export function QuizSystem({ user }: QuizSystemProps) {
  const { toast } = useToast()
  const [activeView, setActiveView] = useState<"list" | "create" | "take">("list")
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    topic: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    content: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userQuizzes, userAttempts] = await Promise.all([
        database.getQuizzes(user.id),
        database.getQuizAttempts(user.id),
      ])
      setQuizzes(userQuizzes)
      setAttempts(userAttempts)
    } catch (error) {
      console.error("Failed to load quiz data:", error)
      toast({
        title: "Error",
        description: "Failed to load quizzes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateQuiz = async () => {
    if (!newQuiz.title.trim() || !newQuiz.topic.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and topic",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuiz),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate quiz")
      }

      const questionsData = await response.json()

      // Create quiz with generated questions
      const questions = questionsData.questions.map((q: any, index: number) => ({
        id: `q-${Date.now()}-${index}`,
        type: q.type as "multiple_choice" | "true_false" | "short_answer",
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points || 1,
      }))

      const quiz = await database.createQuiz({
        user_id: user.id,
        subject_id: null,
        title: newQuiz.title,
        description: newQuiz.description,
        topic: newQuiz.topic,
        difficulty: newQuiz.difficulty,
        questions: questions,
        total_questions: questions.length,
        estimated_time: Math.ceil(questions.length * 1.5), // 1.5 mins per question
      })

      setQuizzes((prev) => [quiz, ...prev])
      setNewQuiz({ title: "", description: "", topic: "", difficulty: "medium", content: "" })
      setIsCreating(false)
      setActiveView("list")

      toast({
        title: "Quiz Created!",
        description: `Generated ${questions.length} questions for "${quiz.title}"`,
      })
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate quiz",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    try {
      await database.deleteQuiz(quizId)
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
      toast({
        title: "Quiz Deleted",
        description: "Quiz has been removed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      })
    }
  }

  const getQuizStats = (quiz: Quiz) => {
    const quizAttempts = attempts.filter((a) => a.quiz_id === quiz.id)
    const bestScore = quizAttempts.length > 0 ? Math.max(...quizAttempts.map((a) => a.percentage)) : 0
    const avgScore =
      quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
        : 0

    return {
      attempts: quizAttempts.length,
      bestScore,
      avgScore,
      lastAttempt: quizAttempts[0]?.completed_at,
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200 border-gray-200 dark:border-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading your quizzes...</p>
        </div>
      </div>
    )
  }

  if (activeView === "create" || isCreating) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Create New Quiz
            </h1>
            <p className="text-muted-foreground mt-1">Generate AI-powered quizzes from any topic</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsCreating(false)
              setActiveView("list")
            }}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Back to Quizzes
          </Button>
        </div>

        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              AI Quiz Generator
            </CardTitle>
            <CardDescription>
              Describe your topic and let AI create a comprehensive quiz with multiple question types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quiz Title</label>
                <Input
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., JavaScript Fundamentals"
                  className="bg-white/50 dark:bg-gray-950/50"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Topic</label>
                <Input
                  value={newQuiz.topic}
                  onChange={(e) => setNewQuiz((prev) => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., JavaScript, React, Web Dev"
                  className="bg-white/50 dark:bg-gray-950/50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <Input
                value={newQuiz.description}
                onChange={(e) => setNewQuiz((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this quiz covers"
                className="bg-white/50 dark:bg-gray-950/50"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Content (Optional)
              </label>
              <Textarea
                value={newQuiz.content}
                onChange={(e) => setNewQuiz((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Paste any specific content, notes, or materials you want the quiz to be based on..."
                rows={4}
                className="bg-white/50 dark:bg-gray-950/50 resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty Level</label>
              <div className="flex gap-3">
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setNewQuiz((prev) => ({ ...prev, difficulty: level }))}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                      ${newQuiz.difficulty === level
                        ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                        : "bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                      }
                    `}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateQuiz}
              disabled={!newQuiz.title.trim() || !newQuiz.topic.trim() || isGenerating}
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Brain className="h-5 w-5 mr-2 animate-spin" />
                  Generating Smart Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Quiz with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeView === "take" && selectedQuiz) {
    return (
      <QuizTaker
        quiz={selectedQuiz}
        user={user}
        onComplete={() => {
          setActiveView("list")
          loadData()
        }}
      />
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Quiz System
          </h1>
          <p className="text-muted-foreground mt-1">Master your subjects with AI-generated assessments</p>
        </div>
        <Button
          onClick={() => setActiveView("create")}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            icon: BookOpen,
            label: "Total Quizzes",
            value: quizzes.length,
            color: "text-blue-500",
            bg: "bg-blue-100 dark:bg-blue-900/30",
          },
          {
            icon: Target,
            label: "Quiz Attempts",
            value: attempts.length,
            color: "text-green-500",
            bg: "bg-green-100 dark:bg-green-900/30",
          },
          {
            icon: Trophy,
            label: "Average Score",
            value: `${attempts.length > 0
              ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
              : 0
              }%`,
            color: "text-yellow-500",
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
          },
          {
            icon: BarChart3,
            label: "Best Score",
            value: `${attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0}%`,
            color: "text-purple-500",
            bg: "bg-purple-100 dark:bg-purple-900/30",
          },
        ].map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Available Quizzes
        </h2>

        {quizzes.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50/50 dark:bg-gray-900/50">
            <CardContent className="text-center py-12">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-fit mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Quizzes Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first AI-generated quiz to start testing your knowledge and tracking your progress.
              </p>
              <Button onClick={() => setActiveView("create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const stats = getQuizStats(quiz)
              return (
                <Card
                  key={quiz.id}
                  className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden flex flex-col"
                >
                  <div className={`h-1.5 w-full ${quiz.difficulty === 'easy' ? 'bg-green-500' :
                    quiz.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-white/50 dark:bg-black/50 backdrop-blur-md">
                        {quiz.topic}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`${getDifficultyColor(quiz.difficulty)} border px-2 py-0.5`}
                      >
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 h-10">
                      {quiz.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.estimated_time} min</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{quiz.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        <span>Best: {stats.bestScore}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>{stats.attempts} tries</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedQuiz(quiz)
                        setActiveView("take")
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Quiz
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => database.deleteQuiz(quiz.id).then(loadData)}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Quiz Taking Component
interface QuizTakerProps {
  quiz: Quiz
  user: User
  onComplete: () => void
}

function QuizTaker({ quiz, user, onComplete }: QuizTakerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState((quiz.estimated_time || 30) * 60) // in seconds, default 30 mins
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (quiz.estimated_time) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            submitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const submitQuiz = async () => {
    setIsSubmitting(true)
    try {
      const estimatedTime = (quiz.estimated_time || 30) * 60
      const timeTaken = estimatedTime - timeLeft

      // Calculate score
      const quizAnswers = quiz.questions.map((q: any) => {
        const userAnswer = answers[q.id] || ""
        const isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
        return {
          question_id: q.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: isCorrect ? q.points : 0,
        }
      })

      const totalScore = quizAnswers.reduce((sum: number, a: any) => sum + (a.points_earned || 0), 0)
      const maxScore = quiz.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)
      const percentage = Math.round((totalScore / maxScore) * 100)

      const attempt = await database.createQuizAttempt({
        quiz_id: quiz.id,
        user_id: user.id,
        subject_id: quiz.subject_id ?? null,
        answers: answers,
        score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        time_taken: timeTaken,
        completed_at: new Date().toISOString(),
        total_questions: quiz.questions.length,
      })

      setResults({
        attempt,
        questions: quiz.questions,
        answers: quizAnswers,
      })
      setShowResults(true)

      toast({
        title: "Quiz Completed!",
        description: `You scored ${percentage}% (${totalScore}/${maxScore} points)`,
      })
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showResults && results) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quiz Results</h1>
            <p className="text-muted-foreground">{quiz.title}</p>
          </div>
          <Button onClick={onComplete}>Back to Quizzes</Button>
        </div>

        {/* Score Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-blue-600">{results.attempt.percentage}%</div>
              <div className="text-xl text-muted-foreground">
                {results.attempt.score} out of {results.attempt.max_score} points
              </div>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>Time: {formatTime(results.attempt.time_taken)}</span>
                <span>•</span>
                <span>
                  Correct: {results.answers.filter((a: any) => a.is_correct).length} / {quiz.questions.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <div className="space-y-4">
          {quiz.questions.map((question: any, index: number) => {
            const answer = results.answers.find((a: any) => a.question_id === question.id)
            return (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      {answer?.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">
                          Question {index + 1}: {question.question}
                        </h3>
                        {question.options && (
                          <div className="mt-2 space-y-1">
                            {question.options.map((option: string, optIndex: number) => (
                              <div
                                key={optIndex}
                                className={`p-2 rounded text-sm ${option === question.correct_answer
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : option === answer?.user_answer && !answer.is_correct
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    : "bg-gray-50 dark:bg-gray-800"
                                  }`}
                              >
                                {option}
                                {option === question.correct_answer && " ✓"}
                                {option === answer?.user_answer && option !== question.correct_answer && " ✗"}
                              </div>
                            ))}
                          </div>
                        )}
                        {!question.options && (
                          <div className="mt-2 space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Your answer:</span> {answer?.user_answer || "No answer"}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Correct answer:</span> {question.correct_answer}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Time Remaining</p>
            <p className="text-xl font-bold text-red-600">{formatTime(timeLeft)}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-4">{question.question}</h2>
              <Badge variant="outline" className="mb-4">
                {question.points} {question.points === 1 ? "point" : "points"}
              </Badge>
            </div>

            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-3">
                {question.options.map((option: string, index: number) => (
                  <label
                    key={index}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="text-blue-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "true_false" && (
              <div className="space-y-3">
                {["true", "false"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "short_answer" && (
              <Textarea
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="Enter your answer here..."
                rows={3}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestion < quiz.questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(currentQuestion + 1)} disabled={!answers[question.id]}>
              Next
            </Button>
          ) : (
            <Button
              onClick={submitQuiz}
              disabled={!answers[question.id] || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
