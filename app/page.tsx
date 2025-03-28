import Link from "next/link"
import { Bell, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { MobileNav } from "@/components/mobile-nav"

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
        <header className="py-2 px-2">
          <div className="container max-w-5xl flex justify-between items-center">
            <h1 className="text-3xl font-medium">amanos</h1>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/">Home</Link> 
              <Link href="/prepare">Prepare</Link>
              <Link href="/contacts">Contacts</Link>
              <form action="/api/auth/signout" method="post">
                <Button variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
            <MobileNav />
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <div className="container max-w-5xl px-4 py-8 flex-1 flex flex-col">
            {/* Split screen container */}
            <div className="rounded-2xl overflow-hidden flex flex-col md:flex-row flex-1 mb-8">
              {/* Left panel - Create an alert */}
              <div className="bg-red-100 flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-full bg-red-200 flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-red-500 flex-shrink-0" />
                  </div>
                  <h2 className="text-2xl font-medium">Create Alert</h2>
                  <p className="text-muted-foreground mt-2">Set up notifications for important events</p>
                  <Button asChild className="bg-red-300 hover:bg-red-400 text-black mt-6">
                    <Link href="/create-alert">Create Alert</Link>
                  </Button>
                </div>
              </div>

              {/* Right panel - Prepare for future */}
              <div className="bg-red-200 flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-full bg-red-300 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-red-500 flex-shrink-0" />
                  </div>
                  <h2 className="text-2xl font-medium">Prepare for Future</h2>
                  <p className="text-muted-foreground mt-2">Plan ahead and stay organized</p>
                  <Button asChild className="bg-red-400 hover:bg-red-500 text-black mt-6">
                    <Link href="/prepare">Get Started</Link>
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground mb-8"><Link href="/faq">how does this work?</Link></p>
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
      <header className="py-2 px-2">
        <div className="text-center">
          <h1 className="text-4xl font-medium">amanos</h1>
          <p className="text-lg text-muted-foreground mt-2">an app to keep us safe</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-medium mb-4">welcome to amanos</h2>
            <p className="text-muted-foreground mb-6">emergency peace of mind, at your fingertips.</p>
            <Button asChild className="bg-red-400 hover:bg-red-500 text-black">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
}

