"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  MoreVertical,
  Plus,
  Sparkles,
  ArrowRight,
  Target,
} from "lucide-react"
import { database, type StudyPlan } from "@/lib/database"
import type { User } from "@/lib/auth"
import type { AIPlanResponse, StudyPlanDay } from "@/lib/study-plan-schema"
import { useToast } from "@/hooks/use-toast"

interface StudyPlannerProps {
  user: User
}

export function StudyPlanner({ user }: StudyPlannerProps) {
  const { toast } = useToast()
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Generation state
  const [topic, setTopic] = useState("")
  const [goal, setGoal] = useState("")
  const [days, setDays] = useState("7")
  const [hoursPerDay, setHoursPerDay] = useState("2")

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const userPlans = await database.getStudyPlans(user.id)
      setPlans(userPlans)
      if (userPlans.length > 0 && !activePlan) {
        setActivePlan(userPlans[0])
      }
    } catch (error) {
      console.error("Failed to load study plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const generatePlan = async () => {
    if (!topic || !goal) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-study-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          goal,
          days,
          hoursPerDay,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate plan")
      }

      const planData = await response.json() as AIPlanResponse

      // 2. Save to database
      const newPlan = await database.createStudyPlan({
        user_id: user.id,
        subject_id: "general", // You might want to let user select a subject
        title: planData.title,
        description: planData.description,
        goals: [goal],
        schedule: planData.schedule,
        progress: {},
        is_active: true,
      })

      setPlans((prev) => [newPlan, ...prev])
      setActivePlan(newPlan)

      toast({
        title: "Study Plan Generated!",
        description: `Your ${days}-day plan for ${topic} is ready.`,
      })

      // Reset form
      setTopic("")
      setGoal("")

    } catch (error) {
      console.error("Failed to generate plan:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate study plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading study plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto">
      {/* Sidebar - Plan List & Generator */}
      <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              AI Plan Generator
            </CardTitle>
            <CardDescription>Create a custom roadmap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Input
                placeholder="e.g. React Hooks"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-white/50 dark:bg-gray-950/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal</label>
              <Input
                placeholder="e.g. Master useEffect"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="bg-white/50 dark:bg-gray-950/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Days</label>
                <Input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  min={1}
                  max={30}
                  className="bg-white/50 dark:bg-gray-950/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Hours</label>
                <Input
                  type="number"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  min={1}
                  max={12}
                  className="bg-white/50 dark:bg-gray-950/50"
                />
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
              onClick={generatePlan}
              disabled={isGenerating || !topic || !goal}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="flex-1 overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Your Plans</h3>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setActivePlan(plan)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all border
                    ${activePlan?.id === plan.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                      : "bg-white/40 dark:bg-gray-900/40 border-transparent hover:bg-white/60 dark:hover:bg-gray-900/60"
                    }
                  `}
                >
                  <h4 className={`font-medium ${activePlan?.id === plan.id ? "text-blue-700 dark:text-blue-300" : ""}`}>
                    {plan.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{plan.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content - Timeline View */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activePlan ? (
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{activePlan.title}</h2>
              <div className="flex flex-wrap gap-2">
                {activePlan.goals.map((g: string, i: number) => (
                  <Badge key={i} variant="secondary" className="bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <Target className="h-3 w-3 mr-1" />
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="relative pl-8 pb-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-blue-200 before:via-indigo-200 before:to-transparent dark:before:from-blue-800 dark:before:via-indigo-800">
                {Object.entries(activePlan.schedule).map(([day, content]: [string, StudyPlanDay], index) => (
                  <div key={day} className="relative group">
                    <div className="absolute -left-[37px] top-0 p-1 bg-white dark:bg-black rounded-full border-2 border-blue-100 dark:border-blue-900 group-hover:scale-110 transition-transform duration-300 z-10">
                      <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 shadow-lg shadow-blue-500/50" />
                    </div>

                    <Card className="border-0 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden hover:bg-white/80 dark:hover:bg-gray-900/80 transition-colors">
                      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400">{day}</span>
                            <span className="text-gray-400">|</span>
                            <span>{content.focus}</span>
                          </h3>
                          <Badge variant="outline" className="bg-white/50">
                            <Clock className="h-3 w-3 mr-1" />
                            {hoursPerDay}h
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Tasks
                            </h4>
                            <ul className="space-y-2">
                              {content.tasks?.map((task: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-sm group/item">
                                  <div className="mt-0.5 text-blue-500/50 group-hover/item:text-blue-600 transition-colors">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                  <span className="group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div className="max-w-md space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">No Plan Selected</h3>
              <p className="text-muted-foreground">
                Select a plan from the sidebar or generate a new AI-powered study roadmap to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
