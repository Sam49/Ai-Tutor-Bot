import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Logout() {
  const authManager = auth
  await authManager?.signOut()
  redirect("/login")
}
