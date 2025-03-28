import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AlertForm } from "@/components/alert/alert-form"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"

export default async function CreateAlertPage() {
  let user = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (!user) {
        redirect("/sign-in")
      }
    } else {
      redirect("/sign-in")
    }
  } catch (error) {
    console.error("Error in CreateAlertPage:", error)
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <DashboardNav user={user} />
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl py-8 px-4">
        <h1 className="text-3xl font-medium mb-8">Create alert</h1>

        <Card className="bg-blue-100 border-2 border-black mb-8">
          <CardHeader>
            <CardTitle>prepare to alert</CardTitle>
            <CardDescription>Configure notifications for important events</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertForm />
          </CardContent>
        </Card>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
}

