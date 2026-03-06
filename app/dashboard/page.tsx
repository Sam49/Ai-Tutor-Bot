import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { UserProfile } from "@/components/user-profile"

export default async function Dashboard() {
  const authManager = auth
  const user = authManager?.getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <UserProfile user={user} />
}
