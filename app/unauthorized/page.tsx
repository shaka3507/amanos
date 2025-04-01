import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { createClient } from "@/utils/supabase/server"
import { MobileNav } from "@/components/mobile-nav"

export default async function UnauthorizedPage() {
  let user = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user
    }
  } catch (error) {
    console.error("Error in UnauthorizedPage:", error)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav user={user} />
          <div className="mr-4 hidden md:flex">
            <DashboardNav user={user} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 border-2 border-red-400 p-8 rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
            <Link 
              href="/"
              className="bg-blue-400 hover:bg-blue-500 text-black px-4 py-2 rounded-lg transform transition-transform hover:translate-x-1 hover:translate-y-1 inline-block"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
} 