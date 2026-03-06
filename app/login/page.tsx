import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AuthPage } from "@/components/auth-page"

export default async function Login() {
  const authManager = auth
  const user = authManager?.getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return <AuthPage mode="login" />
}
