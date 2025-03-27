"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { LogOut, User, Grid, Settings } from "lucide-react"

export function DashboardNav({ user: initialUser }: { user: any }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(initialUser)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUser(initialUser)
  }, [initialUser])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      if (supabase) {
        await supabase.auth.signOut()
        setUser(null)
        router.push("/")
      }
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Only render the full navbar on the client to avoid hydration issues
  if (!isClient) {
    return (
      <header className="border-b py-4 px-8">
        <div className="container max-w-5xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-medium text-xl">
              amanos
            </Link>
          </div>
        </div>
      </header>
    )
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Grid },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <header className="border-b py-4 px-8">
      <div className="container max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-medium text-xl">
            amanos
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}

