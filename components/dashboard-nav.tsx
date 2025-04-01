"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { LogOut, User, Grid, Settings, Shield } from "lucide-react"

export function DashboardNav({ user: initialUser }: { user: any }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(initialUser)
  const [isClient, setIsClient] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUser(initialUser)
    
    // Check if user has admin role
    const checkAdminRole = async () => {
      if (initialUser?.id) {
        try {
          const supabase = createClient()
          if (supabase) {
            const { data } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', initialUser.id)
              .single()
            
            setIsAdmin(data?.role === 'admin')
          }
        } catch (error) {
          console.error("Error checking admin role:", error)
        }
      }
    }
    
    checkAdminRole()
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
    { href: "/prepare", label: "Prepare" },
    { href: "/contacts", label: "Contacts" },
  ]

  // Add the admin item if user is an admin
  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Admin" })
  }

  return (
    <header className="border-b py-4 px-8">
    
      <div className="container max-w-5xl">
      
        <div className="flex items-center justify-between space-x-6">
          <Link href="/" className="font-medium text-xl">
            amanos
          </Link>
          <div className="flex-1 flex justify-end items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 ${
                      isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            
            {user && user.email && (
              <div className="text-sm text-muted-foreground hidden md:block">
                {user.email}
              </div>
            )}

            {user && <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </Button>}
          </div>
        </div>
      </div>
    </header>
  )
}

