import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, ChevronRight } from "lucide-react"

export default async function AdminAlertsPage() {
  let user = null
  let userAlerts: any[] = []

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (user) {
        // Get all alerts created by the current user
        // const { data: userAlertsData } = await supabase
        //   .from('alerts')
        //   .select('*, groups(name), created_by_user:created_by(email)')
        //   .eq('created_by', user.id)
        //   .order('created_at', { ascending: false })

        const { data: userAlertsData } = await supabase
          .from('alerts')
          .select('*')
          .eq('created_by', user.id)
          .eq('status', 'active')

        const { data: pastAlertsData } = await supabase
          .from('alerts')
          .select('*')
          .eq('created_by', user.id)
          .eq('status', 'past')
        
        userAlerts = userAlertsData || []
      }
    }
  } catch (error) {
    console.error("Error in AdminAlertsPage:", error)
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
    if (!createdAt) return "";

    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

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

      <main className="flex-1">
        <div className="container max-w-5xl py-8 px-4">
          <div className="flex items-center mb-8">
            <Link href="/admin" className="mr-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Ongoing alerts</h1>
          </div>

          <div className="flex justify-end mb-6">
            <Button asChild className="bg-red-400 hover:bg-red-500 text-black transform transition-transform hover:translate-x-1 hover:translate-y-1">
              <Link href="/admin/alerts/create" className="flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Create New Alert
              </Link>
            </Button>
          </div>

          <div className="bg-white border-2 border-black rounded-md overflow-hidden mb-8">
            <div className="grid grid-cols-12 bg-blue-100 px-4 py-3 border-b border-gray-200">
              <div className="col-span-4 font-medium">Alert Title</div>
              <div className="col-span-3 font-medium">Group</div>
              <div className="col-span-2 font-medium">Created By</div>
              <div className="col-span-2 font-medium">Duration</div>
              <div className="col-span-1 font-medium text-right">View</div>
            </div>
            
            <div className="divide-y">
              {userAlerts.map((alert: any) => (
                <div key={alert.id} className="grid grid-cols-12 px-4 py-3 items-center">
                  <div className="col-span-4 font-medium">{formatTitle(alert.title)}</div>
                  <div className="col-span-3">{alert.groups?.name || 'No Group'}</div>
                  <div className="col-span-2">{alert.created_by_user?.email?.split('@')[0] || 'Unknown'}</div>
                  <div className="col-span-2">{formatDuration(alert.created_at)}</div>
                  <div className="col-span-1 text-right">
                    <Link 
                      href={`/alerts/${alert.id}`} 
                      className="w-8 h-8 inline-flex rounded-full items-center justify-center border-2 border-black hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))}

              {userAlerts.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">
                  You haven't created any alerts yet. Click the "Create New Alert" button to get started.
                </div>
              )}
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
