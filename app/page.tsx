import Link from "next/link"
import { Bell, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { MobileNav } from "@/components/mobile-nav"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function HomePage() {
  let user = null
  let alerts = []

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      user = data?.user
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('archived', false)
      alerts = alertsData || []

      console.log(alerts)
    }
  } catch (error) {
    console.error("Error in HomePage:", error)
  }

  // If user is logged in, show the split screen with Create Alert and Prepare for Future
  if (user) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <MobileNav />
            <div className="mr-4 hidden md:flex">
              <DashboardNav user={user} />
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <div className="container max-w-5xl px-4 py-8 flex-1 flex flex-col">
            {/* Display current alerts */}
            {alerts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-medium mb-4">Current Alerts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {alerts.map((alert: { id: string; title: string; description: string }) => (
                    <div key={alert.id} className="bg-yellow-100 border-2 border-black p-4">
                      <h3 className="text-xl font-semibold">{alert.title}</h3>
                      <p className="text-muted-foreground mt-2">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split screen container */}
            <div className="overflow-hidden flex flex-col md:flex-row flex-1 mb-8">
              {/* Left panel - Create an alert */}
              <div className="bg-blue-100 border-2 border-black flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-blue-200 flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-red-500 flex-shrink-0" />
                  </div>
                  <h2 className="text-2xl font-medium">Create Alert</h2>
                  <p className="text-muted-foreground mt-2">Set up notifications for important events</p>
                  <Button asChild className="bg-blue-300 hover:bg-blue-400 text-black mt-6 transform transition-transform hover:translate-x-1 hover:translate-y-1">
                    <Link href="/create-alert">Create Alert</Link>
                  </Button>
                </div>
              </div>

              {/* Right panel - Prepare for future */}
              <div className="bg-green-100 border-2 border-black flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-green-200 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-red-500 flex-shrink-0" />
                  </div>
                  <h2 className="text-2xl font-medium">Prepare for Future</h2>
                  <p className="text-muted-foreground mt-2">Plan ahead and stay organized</p>
                  <Button asChild className="bg-green-300 hover:bg-green-400 text-black mt-6 transform transition-transform hover:translate-x-1 hover:translate-y-1">
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
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <DashboardNav user={user} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-blue-100 border-2 border-black p-8 mb-6">
            <h2 className="text-2xl font-medium mb-4">welcome to amanos</h2>
            <p className="text-muted-foreground mb-6">emergency peace of mind, at your fingertips.</p>
            <Button asChild className="bg-blue-400 hover:bg-blue-500 text-black transform transition-transform hover:translate-x-1 hover:translate-y-1">
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

