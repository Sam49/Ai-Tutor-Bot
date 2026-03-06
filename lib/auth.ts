import { getSupabaseClient, isSupabaseConfigured } from "./supabase"

export interface User {
  id: string
  email: string | null
  created_at: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  aud: string
}

export class AuthManager {
  private static instance: AuthManager
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  constructor() {
    // Only load user from localStorage on client side
    if (typeof window !== "undefined") {
      this.loadUserFromStorage()
    }
  }

  private loadUserFromStorage() {
    if (typeof window === "undefined") return

    try {
      const storedUser = localStorage.getItem("demo-user")
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser)
      }
    } catch (error) {
      console.error("Error loading user from storage:", error)
      if (typeof window !== "undefined") {
        localStorage.removeItem("demo-user")
      }
    }
  }

  private saveUserToStorage(user: User | null) {
    if (typeof window === "undefined") return

    if (user) {
      localStorage.setItem("demo-user", JSON.stringify(user))
    } else {
      localStorage.removeItem("demo-user")
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentUser))
  }

  async signInWithPassword(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase is not properly configured.")
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          return { user: null, error }
        }

        this.currentUser = data.user as User
        this.notifyListeners()
        return { user: data.user as User, error: null }
      } else {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Create demo user
        const user: User = {
          id: "demo-user-" + Date.now(),
          email,
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: { username: email.split("@")[0] },
          aud: "authenticated",
        }

        this.currentUser = user
        this.saveUserToStorage(user)
        this.notifyListeners()

        return { user, error: null }
      }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase is not properly configured.")
        }
        const { data, error } = await supabase.auth.signUp({ email, password })

        if (error) {
          return { user: null, error }
        }

        this.currentUser = data.user as User
        this.notifyListeners()
        return { user: data.user as User, error: null }
      } else {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Create demo user
        const user: User = {
          id: "demo-user-" + Date.now(),
          email,
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: { username: email.split("@")[0] },
          aud: "authenticated",
        }

        this.currentUser = user
        this.saveUserToStorage(user)
        this.notifyListeners()

        return { user, error: null }
      }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  async signInAnonymously(): Promise<{ user: User | null; error: Error | null }> {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const user: User = {
        id: "demo-anonymous-" + Date.now(),
        email: null,
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
      }

      this.currentUser = user
      this.saveUserToStorage(user)
      this.notifyListeners()

      return { user, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase is not properly configured.")
        }
        const { error } = await supabase.auth.signOut()

        if (error) {
          return { error }
        }

        this.currentUser = null
        this.notifyListeners()
        return { error: null }
      } else {
        this.currentUser = null
        this.saveUserToStorage(null)
        this.notifyListeners()
        return { error: null }
      }
    } catch (error) {
      return { error: error as Error }
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    this.listeners.push(callback)

    // Call immediately with current state
    callback(this.currentUser)

    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(callback)
        if (index > -1) {
          this.listeners.splice(index, 1)
        }
      },
    }
  }
}

// Only create instance on client side
export const auth = typeof window !== "undefined" ? AuthManager.getInstance() : null
