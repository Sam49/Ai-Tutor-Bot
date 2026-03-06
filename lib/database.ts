import { supabase, isSupabaseConfigured } from "./supabase"
import type {
  Profile as SBProfile,
  Subject,
  ChatSession,
  Quiz as SBQuiz,
  QuizAttempt as SBQuizAttempt,
  LearningProgress as SBLearningProgress,
  StudySession as SBStudySession,
  StudyPlan as SBStudyPlan,
  Message as SBMessage,
} from "./supabase"

// Re-export shared types for consumers like components/user-profile.tsx
export type Profile = SBProfile
export type Message = SBMessage
export type StudyPlan = SBStudyPlan
export type Quiz = SBQuiz
export type QuizAttempt = SBQuizAttempt
export type LearningProgress = SBLearningProgress
export type StudySession = SBStudySession

// Detect "table missing / schema cache" errors to allow graceful fallbacks
function isMissingTableError(error: any): boolean {
  const msg = String(error?.message || error?.hint || error?.details || "")
  return (
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("not exist")
  )
}

// Helper: validate UUID format (lower- or upper-case)
function isUuid(v?: string | null): boolean {
  if (!v || typeof v !== "string") return false
  // UUID v4/v1 flexible check
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v)
}

/**
 * Demo database backed by localStorage (client-only).
 * Used when Supabase environment variables are not present OR when we have a non-UUID demo user id.
 */
class DemoDatabase {
  private getStorageKey(table: string, userId?: string): string {
    return userId ? `demo_${table}_${userId}` : `demo_${table}`
  }

  private getData<T>(table: string, userId?: string): T[] {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(this.getStorageKey(table, userId))
      return data ? (JSON.parse(data) as T[]) : []
    } catch {
      return []
    }
  }

  private setData<T>(table: string, data: T[], userId?: string): void {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(this.getStorageKey(table, userId), JSON.stringify(data))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  // ---------------- Profiles ----------------
  async getProfiles(userId: string): Promise<Profile[]> {
    return this.getData<Profile>("profiles", userId)
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const profiles = this.getData<Profile>("profiles", userId)
    return profiles[0] ?? null
  }

  async createProfile(profile: Omit<Profile, "id" | "created_at" | "updated_at">): Promise<Profile> {
    const profiles = this.getData<Profile>("profiles", profile.user_id)
    const now = new Date().toISOString()
    const newProfile: Profile = {
      ...profile,
      id: `demo_${Date.now()}`,
      created_at: now,
      updated_at: now,
    } as Profile
    profiles.push(newProfile)
    this.setData("profiles", profiles, profile.user_id)
    return newProfile
  }

  async upsertProfile(payload: Partial<Profile> & { user_id: string }): Promise<Profile> {
    const profiles = this.getData<Profile>("profiles", payload.user_id)
    const now = new Date().toISOString()

    if (profiles.length > 0) {
      const current = profiles[0]
      const updated: Profile = {
        ...current,
        ...payload,
        updated_at: now,
      } as Profile
      profiles[0] = updated
      this.setData("profiles", profiles, payload.user_id)
      return updated
    }

    const created: Profile = {
      id: `demo_${Date.now()}`,
      user_id: payload.user_id,
      username: payload.username ?? "User",
      email: payload.email ?? "",
      created_at: now,
      updated_at: now,
    } as Profile
    profiles.push(created)
    this.setData("profiles", profiles, payload.user_id)
    return created
  }

  // ---------------- Subjects ----------------
  async getSubjects(userId: string): Promise<Subject[]> {
    return this.getData<Subject>("subjects", userId)
  }

  async createSubject(subject: Omit<Subject, "id" | "created_at" | "updated_at">): Promise<Subject> {
    const subjects = this.getData<Subject>("subjects", subject.user_id)
    const now = new Date().toISOString()
    const newSubject: Subject = {
      ...subject,
      id: `demo_${Date.now()}`,
      created_at: now,
      updated_at: now,
    } as Subject
    subjects.push(newSubject)
    this.setData("subjects", subjects, subject.user_id)
    return newSubject
  }

  // ---------------- Chat sessions/messages ----------------
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    return this.getData<ChatSession>("chat_sessions", userId)
  }

  async createSession(userId: string): Promise<ChatSession> {
    const sessions = this.getData<ChatSession>("chat_sessions", userId)
    const now = new Date().toISOString()
    const newSession: ChatSession = {
      id: `demo_session_${Date.now()}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    } as ChatSession
    sessions.push(newSession)
    this.setData("chat_sessions", sessions, userId)
    return newSession
  }

  async createChatSession(session: Omit<ChatSession, "id" | "created_at" | "updated_at">): Promise<ChatSession> {
    const sessions = this.getData<ChatSession>("chat_sessions", session.user_id)
    const now = new Date().toISOString()
    const newSession: ChatSession = {
      ...session,
      id: `demo_${Date.now()}`,
      created_at: now,
      updated_at: now,
    } as ChatSession
    sessions.push(newSession)
    this.setData("chat_sessions", sessions, session.user_id)
    return newSession
  }

  async updateChatSession(
    userId: string,
    sessionId: string,
    updates: Partial<ChatSession>,
  ): Promise<ChatSession | null> {
    const sessions = this.getData<ChatSession>("chat_sessions", userId)
    const idx = sessions.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    sessions[idx] = { ...(sessions[idx] as any), ...updates, updated_at: new Date().toISOString() }
    this.setData("chat_sessions", sessions, userId)
    return sessions[idx]
  }

  async createMessage(message: Omit<Message, "id" | "created_at">): Promise<Message> {
    const messages = this.getData<Message>("messages")
    const newMessage: Message = {
      ...message,
      id: `demo_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    } as Message
    messages.push(newMessage)
    this.setData("messages", messages)
    return newMessage
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    const messages = this.getData<Message>("messages")
    return messages
      .filter((m) => (m as any).session_id === sessionId)
      .sort((a, b) => +new Date((a as any).created_at) - +new Date((b as any).created_at))
  }

  // ---------------- Quizzes ----------------
  async getQuizzes(userId: string): Promise<SBQuiz[]> {
    return this.getData<SBQuiz>("quizzes", userId)
  }

  async createQuiz(quiz: Omit<SBQuiz, "id" | "created_at" | "updated_at">): Promise<SBQuiz> {
    const quizzes = this.getData<SBQuiz>("quizzes", quiz.user_id)
    const now = new Date().toISOString()
    const newQuiz: SBQuiz = {
      ...quiz,
      id: `demo_${Date.now()}`,
      created_at: now,
      updated_at: now,
    } as SBQuiz
    quizzes.push(newQuiz)
    this.setData("quizzes", quizzes, quiz.user_id)
    return newQuiz
  }

  async deleteQuiz(quizId: string): Promise<void> {
    const quizzes = this.getData<SBQuiz>("quizzes")
    const updatedQuizzes = quizzes.filter((q) => q.id !== quizId)
    this.setData("quizzes", updatedQuizzes)
  }

  async getQuizAttempts(userId: string): Promise<SBQuizAttempt[]> {
    return this.getData<SBQuizAttempt>("quiz_attempts", userId)
  }

  async createQuizAttempt(attempt: Omit<SBQuizAttempt, "id" | "created_at">): Promise<SBQuizAttempt> {
    const attempts = this.getData<SBQuizAttempt>("quiz_attempts", attempt.user_id)
    const newAttempt: SBQuizAttempt = {
      ...attempt,
      id: `demo_${Date.now()}`,
      created_at: new Date().toISOString(),
    } as SBQuizAttempt
    attempts.push(newAttempt)
    this.setData("quiz_attempts", attempts, attempt.user_id)
    return newAttempt
  }

  // ---------------- Learning progress ----------------
  async getLearningProgress(userId: string): Promise<SBLearningProgress[]> {
    return this.getData<SBLearningProgress>("learning_progress", userId)
  }

  async updateLearningProgress(
    progress: Omit<SBLearningProgress, "id" | "created_at" | "updated_at">,
  ): Promise<SBLearningProgress> {
    const progressData = this.getData<SBLearningProgress>("learning_progress", progress.user_id)
    const existingIndex = progressData.findIndex(
      (p) =>
        (p as any).user_id === (progress as any).user_id &&
        (p as any).subject_id === (progress as any).subject_id &&
        (p as any).topic === (progress as any).topic,
    )

    if (existingIndex >= 0) {
      const updated: SBLearningProgress = {
        ...(progressData[existingIndex] as any),
        ...progress,
        updated_at: new Date().toISOString(),
      } as SBLearningProgress
      progressData[existingIndex] = updated
      this.setData("learning_progress", progressData, progress.user_id)
      return updated
    } else {
      const newProgress: SBLearningProgress = {
        ...(progress as any),
        id: `demo_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as SBLearningProgress
      progressData.push(newProgress)
      this.setData("learning_progress", progressData, progress.user_id)
      return newProgress
    }
  }

  // ---------------- Study sessions ----------------
  async getStudySessions(userId: string): Promise<StudySession[]> {
    return this.getData<StudySession>("study_sessions", userId)
  }

  async createStudySession(session: Omit<StudySession, "id" | "created_at">): Promise<StudySession> {
    const sessions = this.getData<StudySession>("study_sessions", session.user_id)
    const newSession: StudySession = {
      ...session,
      id: `demo_${Date.now()}`,
      created_at: new Date().toISOString(),
    } as StudySession
    sessions.push(newSession)
    this.setData("study_sessions", sessions, session.user_id)
    return newSession
  }

  // ---------------- Study plans ----------------
  async getStudyPlans(userId: string): Promise<StudyPlan[]> {
    return this.getData<StudyPlan>("study_plans", userId)
  }

  async createStudyPlan(plan: Omit<StudyPlan, "id" | "created_at" | "updated_at">): Promise<StudyPlan> {
    const plans = this.getData<StudyPlan>("study_plans", plan.user_id)
    const now = new Date().toISOString()
    const newPlan: StudyPlan = {
      ...plan,
      id: `demo_${Date.now()}`,
      created_at: now,
      updated_at: now,
    } as StudyPlan
    plans.push(newPlan)
    this.setData("study_plans", plans, plan.user_id)
    return newPlan
  }
}

/**
 * Production database using Supabase.
 * Falls back to demo storage if:
 * - Supabase tables are missing, or
 * - The provided user_id is not a valid UUID (demo users).
 */
const demoForChat = new DemoDatabase()
let chatTablesAvailable = true

class ProductionDatabase {
  // ---------------- Profiles ----------------
  async getProfiles(userId: string): Promise<Profile[]> {
    if (!supabase || !isUuid(userId)) return demoForChat.getProfiles(userId)
    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId)
    if (error) throw error
    return (data as Profile[]) ?? []
  }

  async getProfile(userId: string): Promise<Profile | null> {
    if (!supabase || !isUuid(userId)) return demoForChat.getProfile(userId)
    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle()
    if (error) throw error
    return data ? (data as Profile) : null
  }

  async createProfile(profile: Omit<Profile, "id" | "created_at" | "updated_at">): Promise<Profile> {
    if (!supabase || !isUuid(profile.user_id)) return demoForChat.createProfile(profile)
    const { data, error } = await supabase.from("profiles").insert(profile as any).select().single()
    if (error) throw error
    return data as Profile
  }

  async upsertProfile(payload: Partial<Profile> & { user_id: string }): Promise<Profile> {
    if (!supabase || !isUuid(payload.user_id)) return demoForChat.upsertProfile(payload)
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload as any, { onConflict: "user_id", ignoreDuplicates: false })
      .select()
      .maybeSingle()

    if (error) throw error
    return data ? (data as Profile) : (await this.getProfile(payload.user_id))!
  }

  // ---------------- Subjects ----------------
  async getSubjects(userId: string): Promise<Subject[]> {
    if (!supabase || !isUuid(userId)) return demoForChat.getSubjects(userId)
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as Subject[]) ?? []
  }

  async createSubject(subject: Omit<Subject, "id" | "created_at" | "updated_at">): Promise<Subject> {
    if (!supabase || !isUuid(subject.user_id)) return demoForChat.createSubject(subject)
    const { data, error } = await supabase.from("subjects").insert(subject as any).select().single()
    if (error) throw error
    return data as Subject
  }

  // ---------------- Chat sessions/messages ----------------
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    if (!supabase || !isUuid(userId) || !chatTablesAvailable) return demoForChat.getChatSessions(userId)

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      if (isMissingTableError(error)) {
        chatTablesAvailable = false
        return demoForChat.getChatSessions(userId)
      }
      throw error
    }
    return (data as ChatSession[]) ?? []
  }

  async createSession(userId: string): Promise<ChatSession> {
    if (!supabase || !isUuid(userId) || !chatTablesAvailable) return demoForChat.createSession(userId)

    const { data, error } = await supabase.from("chat_sessions").insert({ user_id: userId } as any).select().single()
    if (error) {
      if (isMissingTableError(error)) {
        chatTablesAvailable = false
        return demoForChat.createSession(userId)
      }
      throw error
    }
    return data as ChatSession
  }

  async createChatSession(session: Omit<ChatSession, "id" | "created_at" | "updated_at">): Promise<ChatSession> {
    if (!supabase || !isUuid(session.user_id) || !chatTablesAvailable) return demoForChat.createChatSession(session)

    const { data, error } = await supabase.from("chat_sessions").insert(session as any).select().single()
    if (error) {
      if (isMissingTableError(error)) {
        chatTablesAvailable = false
        return demoForChat.createChatSession(session)
      }
      throw error
    }
    return data as ChatSession
  }

  async updateChatSession(
    userId: string,
    sessionId: string,
    updates: Partial<ChatSession>,
  ): Promise<ChatSession | null> {
    if (!supabase || !isUuid(userId) || !chatTablesAvailable)
      return demoForChat.updateChatSession(userId, sessionId, updates)

    const { data, error } = await (supabase as any)
      .from("chat_sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      if (isMissingTableError(error)) {
        chatTablesAvailable = false
        return demoForChat.updateChatSession(userId, sessionId, updates)
      }
      throw error
    }
    return data as ChatSession
  }

  async createMessage(message: Omit<Message, "id" | "created_at">): Promise<Message> {
    // message doesn't carry user_id; keep existing table-availability fallback
    if (!supabase || !chatTablesAvailable) return demoForChat.createMessage(message)

    const { data, error } = await supabase.from("messages").insert(message as any).select().single()
    if (error) {
      if (isMissingTableError(error)) {
        chatTablesAvailable = false
        return demoForChat.createMessage(message)
      }
      throw error
    }
    return data as Message
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    if (!supabase || !chatTablesAvailable) return demoForChat.getSessionMessages(sessionId)

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      if (isMissingTableError(error)) {
        chatTablesAvailable = false
        return demoForChat.getSessionMessages(sessionId)
      }
      throw error
    }
    return (data as Message[]) ?? []
  }

  // ---------------- Quizzes ----------------
  async getQuizzes(userId: string): Promise<Quiz[]> {
    if (!supabase || !isUuid(userId)) return demoForChat.getQuizzes(userId)
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as Quiz[]) ?? []
  }

  async createQuiz(quiz: Omit<Quiz, "id" | "created_at" | "updated_at">): Promise<Quiz> {
    if (!supabase || !isUuid(quiz.user_id)) return demoForChat.createQuiz(quiz)
    const { data, error } = await supabase.from("quizzes").insert(quiz as any).select().single()
    if (error) throw error
    return data as Quiz
  }

  async deleteQuiz(quizId: string): Promise<void> {
    if (!supabase) return demoForChat.deleteQuiz(quizId)
    const { error } = await supabase.from("quizzes").delete().eq("id", quizId)
    if (error) throw error
  }

  async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    if (!supabase || !isUuid(userId)) return demoForChat.getQuizAttempts(userId)
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
    if (error) throw error
    return (data as QuizAttempt[]) ?? []
  }

  async createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "created_at">): Promise<QuizAttempt> {
    if (!supabase || !isUuid(attempt.user_id)) return demoForChat.createQuizAttempt(attempt)
    const { data, error } = await supabase.from("quiz_attempts").insert(attempt as any).select().single()
    if (error) throw error
    return data as QuizAttempt
  }

  // ---------------- Learning progress ----------------
  async getLearningProgress(userId: string): Promise<LearningProgress[]> {
    if (!supabase || !isUuid(userId)) return demoForChat.getLearningProgress(userId)
    const { data, error } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("user_id", userId)
      .order("last_studied", { ascending: false })
    if (error) throw error
    return (data as LearningProgress[]) ?? []
  }

  async updateLearningProgress(
    progress: Omit<LearningProgress, "id" | "created_at" | "updated_at">,
  ): Promise<LearningProgress> {
    if (!supabase || !isUuid(progress.user_id)) return demoForChat.updateLearningProgress(progress)
    const { data, error } = await supabase
      .from("learning_progress")
      .upsert(progress as any, { onConflict: "user_id,subject_id,topic", ignoreDuplicates: false })
      .select()
      .single()
    if (error) throw error
    return data as LearningProgress
  }

  // ---------------- Study sessions ----------------
  async getStudySessions(userId: string): Promise<StudySession[]> {
    if (!supabase || !isUuid(userId)) return demoForChat.getStudySessions(userId)
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as StudySession[]) ?? []
  }

  async createStudySession(session: Omit<StudySession, "id" | "created_at">): Promise<StudySession> {
    if (!supabase || !isUuid(session.user_id)) return demoForChat.createStudySession(session)
    const { data, error } = await supabase.from("study_sessions").insert(session as any).select().single()
    if (error) throw error
    return data as StudySession
  }

  // ---------------- Study plans ----------------
  async getStudyPlans(userId: string): Promise<StudyPlan[]> {
    if (!supabase || !isUuid(userId)) return demoForChat.getStudyPlans(userId)
    const { data, error } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as StudyPlan[]) ?? []
  }

  async createStudyPlan(plan: Omit<StudyPlan, "id" | "created_at" | "updated_at">): Promise<StudyPlan> {
    if (!supabase || !isUuid(plan.user_id)) return demoForChat.createStudyPlan(plan)
    const { data, error } = await supabase.from("study_plans").insert(plan as any).select().single()
    if (error) throw error
    return data as StudyPlan
  }
}

// Export the appropriate database instance and a backwards-compatible alias
const baseDb = isSupabaseConfigured() ? new ProductionDatabase() : new DemoDatabase()
export const db = baseDb
export const database = baseDb
