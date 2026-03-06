import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { StudyPlanSchedule } from "./study-plan-schema"

// Read env vars (NEXT_PUBLIC_ so they can be inlined on the client build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to check configuration; used by UI (e.g., DatabaseSetupBanner)
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && /^https?:\/\//.test(supabaseUrl))
}

// Lazy, singleton client. Do NOT create the client if not configured.
let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return client
}

// Backwards-compatible export; may be null when not configured (Demo Mode)
export const supabase = getSupabaseClient()

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: any
        Update: any
      }
      subjects: {
        Row: Subject
        Insert: any
        Update: any
      }
      chat_sessions: {
        Row: ChatSession
        Insert: any
        Update: any
      }
      messages: {
        Row: Message
        Insert: any
        Update: any
      }
      quizzes: {
        Row: Quiz
        Insert: any
        Update: any
      }
      quiz_attempts: {
        Row: QuizAttempt
        Insert: any
        Update: any
      }
      learning_progress: {
        Row: LearningProgress
        Insert: any
        Update: any
      }
      study_sessions: {
        Row: StudySession
        Insert: any
        Update: any
      }
      study_plans: {
        Row: StudyPlan
        Insert: any
        Update: any
      }
    }
  }
}

export interface Profile {
  id: string
  user_id: string
  username: string | null
  email: string | null
  avatar_url: string | null
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  subject_id: string | null
  title: string
  messages: any[]
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  user_id: string
  subject_id: string | null
  title: string
  description: string | null
  difficulty: "easy" | "medium" | "hard"
  questions: any[]
  topic?: string
  total_questions?: number
  estimated_time?: number
  created_at: string
  updated_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  subject_id: string | null
  answers: Record<string, any>
  score: number
  max_score?: number
  percentage?: number
  total_questions: number
  time_taken: number | null
  completed_at: string
  created_at: string
}

export interface LearningProgress {
  id: string
  user_id: string
  subject_id: string
  topic: string
  mastery_level: number
  study_time: number
  last_studied: string
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  subject_id: string | null
  session_type: "chat" | "quiz" | "review"
  duration: number
  topics_covered: string[]
  performance_data: Record<string, any>
  created_at: string
}

export interface StudyPlan {
  id: string
  user_id: string
  subject_id: string
  title: string
  description: string | null
  progress: Record<string, boolean>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
}
