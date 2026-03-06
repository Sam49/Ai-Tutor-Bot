"use client"

import { useEffect, useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { AuthPage } from "@/components/auth-page"
import { Dashboard } from "@/components/dashboard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { auth } from "@/lib/auth"
import type { User } from "@supabase/supabase-js"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isSupabaseConfigured()) {
      // Demo mode - use demo auth manager
      if (!auth) {
        setLoading(false)
        return
      }

      const { unsubscribe } = auth.onAuthStateChange((user) => {
        setUser(user as any) // Cast demo user to Supabase user type
        setLoading(false)
      })

      return unsubscribe
    } else {
      // Production mode - use Supabase auth
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // Create or update profile when user signs in
        if (session?.user && event === "SIGNED_IN") {
          const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single()

          if (!profile) {
            await supabase.from("profiles").insert({
              user_id: session.user.id,
              username: session.user.email?.split("@")[0] || "User",
              email: session.user.email,
            })
          }
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [mounted])

  // Show loading until component is mounted and auth is ready
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing AI Tutor...</p>
        </div>
      </div>
    )
  }

  // Show dashboard if user is authenticated
  if (user) {
    return <Dashboard user={user} />
  }

  // Show auth page if user clicked sign up/login
  if (showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />
  }

  // Show landing page by default
  return <LandingPage onShowAuth={() => setShowAuth(true)} />
}
