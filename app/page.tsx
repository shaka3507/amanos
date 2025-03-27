import Link from "next/link"
import { Bell, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"

export default async function HomePage() {
  let user = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    }
  } catch (error) {
    console.error("Error in HomePage:", error)
  }

  // If user is logged in, show the split screen with Create Alert and Prepare for Future
  if (user) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="py-6 px-8">
          <div className="container max-w-5xl flex justify-between items-center">
            <h1 className="text-3xl font-medium">amanos</h1>
            <div className="flex items-center gap-4">
              <Link href="/">Home</Link> 
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/profile">Profile</Link>
              <form action="/api/auth/signout" method="post">
                <Button variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <div className="container max-w-5xl px-4 py-8 flex-1 flex flex-col">
            {/* Split screen container */}
            <div className="rounded-2xl overflow-hidden flex flex-col md:flex-row flex-1 mb-8">
              {/* Left panel - Create an alert */}
              <div className="bg-sage-100 flex-1 flex flex-col items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-sage-200 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-sage-500" />
                  </div>
                  <span className="text-xl font-medium text-sage-500">Create an alert</span>
                </div>
                <div className="mt-8">
                  <Button asChild className="bg-sage-300 hover:bg-sage-400 text-black">
                    <Link href="/create-alert">Get Started</Link>
                  </Button>
                </div>
              </div>

              {/* Right panel - Prepare for future */}
              <div className="bg-sage-200 flex-1 flex flex-col items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-sage-300 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-sage-500" />
                  </div>
                  <span className="text-xl font-medium text-sage-500">Prepare for future</span>
                </div>
                <div className="mt-8">
                  <Button asChild className="bg-sage-400 hover:bg-sage-500 text-black">
                    <Link href="/prepare">Plan Ahead</Link>
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground mb-8">How can I support?</p>
          </div>
        </main>

        <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
          <p>© 2025 amanos. All rights reserved.</p>
        </footer>
      </div>
    )
  }

  // If user is not logged in, show the simplified view with sign in/sign up buttons
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-8">
        <div className="text-center">
          <h1 className="text-4xl font-medium">amanos</h1>
          <p className="text-lg text-muted-foreground mt-2">an app to keep us safe</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-sage-100 rounded-2xl p-8 mb-6">
            <p className="mb-6 text-lg">How can I support?</p>

            <div className="flex flex-col gap-4">
              <Button asChild className="bg-sage-400 hover:bg-sage-500 text-black">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
}

