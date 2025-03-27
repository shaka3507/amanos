import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

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
      <header className="py-6 px-8 border-b">
        <div className="container max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
          <h1 className="text-xl font-medium">amanos</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl py-8 px-4">
        <h1 className="text-3xl font-medium mb-8">Create an Alert</h1>

        <Card className="bg-sage-100 border-none mb-8">
          <CardHeader>
            <CardTitle>Set Up Your Alert</CardTitle>
            <CardDescription>Configure notifications for important events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">This feature is coming soon. Stay tuned for updates!</p>
            <Button asChild className="bg-sage-400 hover:bg-sage-500 text-black">
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
}

