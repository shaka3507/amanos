import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Settings, AlertTriangle, Database } from "lucide-react"

export default async function AdminDashboardPage() {
  let user = null
  let userCount = 0
  let alertCount = 0

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      // Get total user count
      const { count: users } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      userCount = users || 0

      // Get total alert count
      const { count: alerts } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
      
      alertCount = alerts || 0
    }
  } catch (error) {
    console.error("Error in AdminDashboardPage:", error)
  }

  const adminMenuItems = [
    {
      title: "Contact Management",
      description: "Manage users and permissions",
      icon: Users,
      link: "/admin/users",
      count: userCount
    },
    {
      title: "Alerts",
      description: "Monitor and manage all alerts",
      icon: AlertTriangle,
      link: "/admin/alerts",
      count: alertCount
    },
    {
      title: "Prep Check",
      description: "Update prepartion checklists",
      icon: Settings,
      link: "/admin/prepartion"
    },
    {
      title: "System Settings",
      description: "Configure application settings",
      icon: Settings,
      link: "/admin/settings"
    }
  ]

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
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-8">Manage your application and users</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminMenuItems.map((item, index) => (
              <Link key={index} href={item.link}>
                <Card className="border-2 border-black hover:bg-slate-50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <div className="h-8 w-8 bg-blue-100 flex items-center justify-center rounded-full">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                    {item.count !== undefined && (
                      <p className="mt-2 text-sm font-medium">Total: {item.count}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
} 