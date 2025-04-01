import Link from "next/link"
import { Bell, Calendar, ChevronRight, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { MobileNav } from "@/components/mobile-nav"
import { DashboardNav } from "@/components/dashboard-nav"
import HomeLocationWrapper from "./home-location-wrapper"
import { WeatherClient } from "@/components/weather-client"

export default async function HomePage() {
  let user = null
  let alerts = []
  let isAdmin = false

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      user = data?.user
      
      if (user) {
        // Get user role to check if admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        isAdmin = profileData?.role === 'admin'
        
        // Get active alerts created by this user
        const { data: alertsData } = await supabase
          .from('alerts')
          .select('*')
          .eq('status', 'active')
          .eq('created_by', user.id)
        alerts = alertsData || []
      }
    }
  } catch (error) {
    console.error("Error in HomePage:", error)
  }

  const formatTitle = (title: string) => {
    // First replace underscores with spaces
    let formattedTitle = title.replace(/_/g, ' ');
    
    // Remove the word "Alert" from the end of the string if present
    formattedTitle = formattedTitle.replace(/\s*Alert$/i, '');
    
    return formattedTitle;
  }

  // Function to calculate and format duration since creation
  const formatDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `Ongoing for ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Ongoing for ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `Ongoing for ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  // If user is logged in, show the main dashboard
  if (user) {
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

        <main className="flex-1 flex flex-col">
          <div className="container max-w-5xl px-4 py-8 flex-1 flex flex-col">
            {/* Weather display */}
            <div className="mb-6">
              <WeatherClient />
            </div>
            
            {/* Display current alerts */}
            {alerts.length > 0 && (
              <div className="mb-8 ml-1">
                <h2 className="text-2xl font-medium mb-4">Ongoing crises</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {alerts.map((alert: { id: string; title: string; description: string; created_at: string }) => (
                    <div key={alert.id} className="bg-[rgb(255,100,92)] border-2 border-black p-4 relative">
                      <h3 className="text-xl font-semibold">{formatTitle(alert.title)}</h3>
                      <p className="text-xs mt-2 font-medium">{formatDuration(alert.created_at).toLowerCase()}</p>
                      <Link 
                        href={`/alerts/${alert.id}`}
                        className="absolute top-6 right-4 w-8 h-8 rounded-full flex items-center justify-center border-2 border-black hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split screen container */}
            <div className="overflow-hidden flex flex-col md:flex-row flex-1 mb-8">
              {/* Left panel - Alert Information */}
              <div className="bg-blue-100 border-2 border-black flex-1 flex items-center justify-center p-8 ml-1">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-blue-200 flex items-center justify-center mb-4">
                    <ShieldAlert className="h-8 w-8 text-red-500 flex-shrink-0" />
                  </div>
                  <h2 className="text-2xl font-medium">Alert System</h2>
                  <p className="text-muted-foreground mt-2">
                    Alerts can only be created by administrators
                  </p>
                  {isAdmin && (
                    <Button asChild className="bg-blue-300 hover:bg-blue-400 text-black mt-6 transform transition-transform hover:translate-x-1 hover:translate-y-1">
                      <Link href="/admin/alerts/create">Create Alert</Link>
                    </Button>
                  )}
                  {!isAdmin && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Contact an administrator if you need to create an alert
                    </p>
                  )}
                </div>
              </div>

              {/* Right panel - Prepare for future */}
              <div className="bg-green-100 border-2 border-black flex-1 flex items-center justify-center p-8 ml-1">
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

            {!user &&<p className="text-center text-muted-foreground mb-8"><Link href="/faq">how does this work?</Link></p>}
          </div>
        </main>

        <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
          <p>© 2025 amanos. All rights reserved.</p>
        </footer>
        
        {/* Location modal */}
        <HomeLocationWrapper />
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
          <div className="">
            <h2 className="text-2xl font-medium mb-4">welcome to amanos</h2>
            <p className="text-muted-foreground mb-6">emergency management, at your fingertips.</p>
            <Button asChild className="rounded-none bg-blue-400 hover:bg-blue-500 text-black transform transition-transform hover:translate-x-1 hover:translate-y-1">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
          
          {/* Weather display */}
          {user &&<div className="mt-6">
            <WeatherClient />
          </div>}
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
      
      {/* Location modal */}
      <HomeLocationWrapper />
    </div>
  )
}

