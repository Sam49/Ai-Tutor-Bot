"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Plus, Trash2, Edit, Search } from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string
  category: string
  progress: number
  totalTopics: number
  completedTopics: number
  lastStudied: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [newSubject, setNewSubject] = useState({
    name: "",
    description: "",
    category: "Programming",
    difficulty: "Intermediate" as const,
    tags: "",
  })

  useEffect(() => {
    // Load subjects from localStorage
    const savedSubjects = localStorage.getItem("learning-subjects")
    if (savedSubjects) {
      const parsedSubjects = JSON.parse(savedSubjects)
      setSubjects(parsedSubjects)
    } else {
      // Initialize with sample data
      const sampleSubjects: Subject[] = [
        {
          id: "1",
          name: "JavaScript Fundamentals",
          description:
            "Learn the core concepts of JavaScript programming including variables, functions, objects, and DOM manipulation.",
          category: "Programming",
          progress: 65,
          totalTopics: 12,
          completedTopics: 8,
          lastStudied: "2024-01-10",
          difficulty: "Intermediate",
          tags: ["javascript", "web-development", "programming"],
        },
        {
          id: "2",
          name: "Spanish Vocabulary",
          description: "Build a strong foundation in Spanish vocabulary with common words, phrases, and expressions.",
          category: "Language",
          progress: 40,
          totalTopics: 20,
          completedTopics: 8,
          lastStudied: "2024-01-09",
          difficulty: "Beginner",
          tags: ["spanish", "language", "vocabulary"],
        },
        {
          id: "3",
          name: "Data Science Basics",
          description: "Introduction to data science concepts, statistics, and Python libraries like pandas and numpy.",
          category: "Data Science",
          progress: 25,
          totalTopics: 15,
          completedTopics: 4,
          lastStudied: "2024-01-08",
          difficulty: "Advanced",
          tags: ["data-science", "python", "statistics"],
        },
      ]

      setSubjects(sampleSubjects)
      localStorage.setItem("learning-subjects", JSON.stringify(sampleSubjects))
    }
  }, [])

  useEffect(() => {
    // Save subjects to localStorage
    localStorage.setItem("learning-subjects", JSON.stringify(subjects))
  }, [subjects])

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const addSubject = () => {
    if (!newSubject.name.trim()) return

    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubject.name,
      description: newSubject.description,
      category: newSubject.category,
      progress: 0,
      totalTopics: 10, // Default
      completedTopics: 0,
      lastStudied: new Date().toISOString().split("T")[0],
      difficulty: newSubject.difficulty,
      tags: newSubject.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
    }

    setSubjects((prev) => [subject, ...prev])
    setNewSubject({
      name: "",
      description: "",
      category: "Programming",
      difficulty: "Intermediate",
      tags: "",
    })
    setIsAddingSubject(false)
  }

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id))
  }

  const updateProgress = (id: string, increment: number) => {
    setSubjects((prev) =>
      prev.map((subject) => {
        if (subject.id === id) {
          const newCompletedTopics = Math.max(0, Math.min(subject.totalTopics, subject.completedTopics + increment))
          const newProgress = Math.round((newCompletedTopics / subject.totalTopics) * 100)
          return {
            ...subject,
            completedTopics: newCompletedTopics,
            progress: newProgress,
            lastStudied: new Date().toISOString().split("T")[0],
          }
        }
        return subject
      }),
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const categories = ["Programming", "Language", "Data Science", "Mathematics", "Design", "Business", "Other"]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subject Manager</h1>
          <p className="text-muted-foreground">Organize and track your learning subjects</p>
        </div>
        <Button onClick={() => setIsAddingSubject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search subjects, categories, or tags..."
          className="pl-10"
        />
      </div>

      {/* Add Subject Form */}
      {isAddingSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Subject</CardTitle>
            <CardDescription>Create a new subject to track your learning progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Name</label>
                <Input
                  value={newSubject.name}
                  onChange={(e) => setNewSubject((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., React Development"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newSubject.category}
                  onChange={(e) => setNewSubject((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newSubject.description}
                onChange={(e) => setNewSubject((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you'll learn in this subject..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty Level</label>
                <div className="flex gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                    <Button
                      key={level}
                      variant={newSubject.difficulty === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewSubject((prev) => ({ ...prev, difficulty: level }))}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={newSubject.tags}
                  onChange={(e) => setNewSubject((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., react, frontend, javascript"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addSubject} disabled={!newSubject.name.trim()}>
                Add Subject
              </Button>
              <Button variant="outline" onClick={() => setIsAddingSubject(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <CardDescription className="mt-1">{subject.category}</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingSubject(subject.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteSubject(subject.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>

              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(subject.difficulty)}>{subject.difficulty}</Badge>
                <Badge variant="outline">{subject.progress}%</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {subject.completedTopics} / {subject.totalTopics} topics
                  </span>
                </div>
                <Progress value={subject.progress} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-1">
                {subject.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Last studied: {new Date(subject.lastStudied).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateProgress(subject.id, -1)}
                    disabled={subject.completedTopics === 0}
                  >
                    -
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateProgress(subject.id, 1)}
                    disabled={subject.completedTopics === subject.totalTopics}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{searchTerm ? "No subjects found" : "No subjects yet"}</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Add your first subject to start tracking your learning progress"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddingSubject(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Subject
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
