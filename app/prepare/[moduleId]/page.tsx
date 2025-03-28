import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Stethoscope, Home, BookOpen, LucideIcon } from "lucide-react"
import { CompleteModuleButton } from "@/components/complete-module-button"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"

const modules = {
  "emergency-basics": {
    id: "emergency-basics",
    title: "Emergency Basics",
    description: "Learn fundamental emergency preparedness skills and knowledge",
    icon: Shield,
    color: "bg-blue-100",
    badgeId: "emergency-basics-badge",
    content: [
      {
        title: "Understanding Emergencies",
        content: "Learn about different types of emergencies and how to identify them."
      },
      {
        title: "Emergency Response Steps",
        content: "Master the basic steps to take when an emergency occurs."
      },
      {
        title: "Emergency Kits",
        content: "Learn what to include in your emergency kit and how to maintain it."
      }
    ]
  },
  "first-aid": {
    id: "first-aid",
    title: "First Aid",
    description: "Essential first aid techniques and emergency medical response",
    icon: Stethoscope,
    color: "bg-blue-200",
    badgeId: "first-aid-badge",
    content: [
      {
        title: "Basic First Aid Skills",
        content: "Learn essential first aid techniques for common injuries."
      },
      {
        title: "CPR and AED",
        content: "Master CPR and AED usage for cardiac emergencies."
      },
      {
        title: "Emergency Medical Response",
        content: "Understand when and how to call emergency services."
      }
    ]
  },
  "home-safety": {
    id: "home-safety",
    title: "Home Safety",
    description: "Secure your home and prepare for various emergency scenarios",
    icon: Home,
    color: "bg-green-100",
    badgeId: "home-safety-badge",
    content: [
      {
        title: "Home Security",
        content: "Learn how to secure your home against various threats."
      },
      {
        title: "Fire Safety",
        content: "Master fire prevention and response techniques."
      },
      {
        title: "Emergency Exits",
        content: "Plan and practice emergency exit routes."
      }
    ]
  },
  "emergency-planning": {
    id: "emergency-planning",
    title: "Emergency Planning",
    description: "Create and maintain effective emergency plans for your family",
    icon: BookOpen,
    color: "bg-purple-100",
    badgeId: "emergency-planning-badge",
    content: [
      {
        title: "Family Emergency Plan",
        content: "Create a comprehensive emergency plan for your family."
      },
      {
        title: "Communication Plan",
        content: "Establish effective communication methods during emergencies."
      },
      {
        title: "Emergency Contacts",
        content: "Organize and maintain emergency contact information."
      }
    ]
  }
}

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
  let user = null
  let isCompleted = false

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (!user) {
        redirect("/sign-in")
      }

      // Check if user has completed this module
      const { data: badgeData } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id)
        .eq("badge_id", modules[params.moduleId as keyof typeof modules].badgeId)
        .single()

      isCompleted = !!badgeData
    } else {
      redirect("/sign-in")
    }
  } catch (error) {
    console.error("Error in ModulePage:", error)
    redirect("/sign-in")
  }

  const module = modules[params.moduleId as keyof typeof modules]
  if (!module) {
    redirect("/prepare")
  }

  const Icon = module.icon

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <DashboardNav />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-5xl py-8 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="ghost" size="sm">
              <Link href="/prepare">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Modules
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-red-500" />
              <h1 className="text-3xl font-medium">{module.title}</h1>
            </div>
          </div>

          <Card className={`${module.color} border-none mb-8`}>
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {module.content.map((section, index) => (
                  <div key={index} className="bg-white rounded-lg p-6">
                    <h3 className="text-xl font-medium mb-2">{section.title}</h3>
                    <p className="text-muted-foreground">{section.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!isCompleted && (
            <div className="flex justify-center">
              <CompleteModuleButton moduleId={module.id} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 