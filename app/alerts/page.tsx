import Link from "next/link"
import { ArrowLeft, ChevronRight, Info } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function AlertsIndexPage() {
  let user = null
  let alerts = []
  let isAdmin = false

  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    user = userData?.user

    if (!user) {
      redirect("/sign-in")
    }

    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    isAdmin = profileData?.role === 'admin'

    // Get all alerts the user has access to via group membership
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    if (memberGroups && memberGroups.length > 0) {
      const groupIds = memberGroups.map((m: any) => m.group_id)
      
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*, groups(name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })

      alerts = alertsData || []
    }
  } catch (error) {
    console.error("Error in AlertsIndexPage:", error)
    redirect("/")
  }

  const formatTitle = (title: string) => {
    if (!title) return 'Untitled';
    
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav user={user} />
          <div className="mr-4 hidden md:flex">
            <DashboardNav user={user} />
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl py-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-medium">All Alerts</h1>
          {isAdmin && (
            <Button asChild className="bg-blue-300 hover:bg-blue-400 text-black transform transition-transform hover:translate-x-1 hover:translate-y-1">
              <Link href="/admin/alerts/create">Create New Alert</Link>
            </Button>
          )}
        </div>
        
        {!isAdmin && (
          <Alert className="mb-6 bg-blue-50 border border-blue-200">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription>
              Alerts can only be created by administrators. Contact an admin if you need to create an alert.
            </AlertDescription>
          </Alert>
        )}

        {alerts.length === 0 ? (
          <div className="bg-[rgb(255,100,92,0.2)] border-2 border-black p-8 text-center">
            <p className="text-lg mb-4">You don't have any alerts yet.</p>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Create an alert to notify others about important events." 
                : "You will see alerts here when you are added to alert groups."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.map((alert: any) => (
              <div 
                key={alert.id} 
                className="bg-[rgb(255,100,92)] border-2 border-black p-6 hover:bg-[rgb(255,80,72)] transition-colors relative"
              >
                <div>
                  <h3 className="text-xl font-semibold">{formatTitle(alert.title)}</h3>
                  <p className="text-muted-foreground mt-2">{alert.description}</p>
                  <p className="text-xs mt-2 font-medium">{formatDuration(alert.created_at)}</p>
                  <div className="flex items-center mt-4">
                    <div className="px-2 py-1 bg-white text-xs">
                      {alert.weather_event_type || alert.category || 'Alert'}
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Link 
                  href={`/alerts/${alert.id}`}
                  className="absolute top-6 right-6 bg-white w-10 h-10 rounded-full flex items-center justify-center border-2 border-black hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
} 