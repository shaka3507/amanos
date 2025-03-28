import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Trophy, BookOpen, Shield, Stethoscope, Home, LucideIcon } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"

interface Module {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: string
  badgeId: string
}

const modules: Module[] = [
  {
    id: "emergency-basics",
    title: "Emergency Basics",
    description: "Learn fundamental emergency preparedness skills and knowledge",
    icon: Shield,
    color: "bg-blue-100",
    badgeId: "emergency-basics-badge"
  },
  {
    id: "first-aid",
    title: "First Aid",
    description: "Essential first aid techniques and emergency medical response",
    icon: Stethoscope,
    color: "bg-blue-200",
    badgeId: "first-aid-badge"
  },
  {
    id: "home-safety",
    title: "Home Safety",
    description: "Secure your home and prepare for various emergency scenarios",
    icon: Home,
    color: "bg-green-100",
    badgeId: "home-safety-badge"
  },
  {
    id: "emergency-planning",
    title: "Emergency Planning",
    description: "Create and maintain effective emergency plans for your family",
    icon: BookOpen,
    color: "bg-purple-100",
    badgeId: "emergency-planning-badge"
  }
]

export default async function PreparePage() {
  let user = null
  let completedBadges: string[] = []

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (!user) {
        redirect("/sign-in")
      }

      // Fetch completed badges for the user
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id)

      if (badgesData) {
        completedBadges = badgesData.map(badge => badge.badge_id)
      }
    } else {
      redirect("/sign-in")
    }
  } catch (error) {
    console.error("Error in PreparePage:", error)
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <DashboardNav />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-5xl py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-medium">Learning Modules</h1>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-red-500" />
              <span className="text-lg font-medium">{completedBadges.length} / {modules.length} Badges Earned</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => {
              const Icon = module.icon
              const isCompleted = completedBadges.includes(module.badgeId)
              
              return (
                <Card key={module.id} className={`${module.color} border-2 border-black shadow-lg`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-red-500" />
                      <div>
                        <CardTitle>{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant={isCompleted ? "default" : "secondary"} className="bg-red-500">
                        {isCompleted ? "Completed" : "Not Started"}
                      </Badge>
                      <Button asChild className="bg-red-600 hover:bg-red-700 text-white transform transition-transform hover:translate-x-1 hover:translate-y-1">
                        <Link href={`/prepare/${module.id}`}>
                          {isCompleted ? "Review" : "Start"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

