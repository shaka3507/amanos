import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AlertGroup } from "@/components/alert/alert-group"
import { MobileNav } from "@/components/mobile-nav"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function AlertPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  let user = null

  try {
    const { data: userData } = await supabase.auth.getUser()
    user = userData?.user

    if (!user) {
      redirect("/sign-in")
    }

    // First get the alert to find its group_id
    const { data: alertData } = await supabase
      .from('alerts')
      .select('group_id, title')
      .eq('id', params.id)
      .single()

    if (!alertData) {
      redirect("/")
    }

    // Check if user is a member of the group
    const { data: memberData } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', alertData.group_id)
      .eq('user_id', user.id)
      .single()

    if (!memberData) {
      redirect("/")
    }
  } catch (error) {
    console.error("Error in AlertPage:", error)
    redirect("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-[100] w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between relative">
          <div className="flex items-center">
            <MobileNav />
            <div className="mr-4 hidden md:flex">
              <DashboardNav user={user} />
            </div>
          </div>
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl py-8 px-4 relative z-0">
        <AlertGroup alertId={params.id} userId={user.id} />
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t relative z-0">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
} 