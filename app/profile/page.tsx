import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/profile-form"

export default async function ProfilePage() {
  let user = null
  let profile = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (!user) {
        redirect("/sign-in")
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      profile = profileData
    } else {
      redirect("/sign-in")
    }
  } catch (error) {
    console.error("Error in ProfilePage:", error)
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      <h1 className="text-3xl font-medium mb-8">Profile</h1>
      <Card className="max-w-2xl mx-auto bg-sage-100 border-none">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>{user && <ProfileForm user={user} profile={profile} />}</CardContent>
      </Card>
    </div>
  )
}

