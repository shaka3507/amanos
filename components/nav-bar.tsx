"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function NavBar({ user: initialUser }: { user: any }) {
  const router = useRouter()
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
        router.refresh()
        router.push("/")
      }
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Only render the full navbar on the client to avoid hydration issues
  if (!isClient) {
    return (
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            Supabase App
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          Supabase App
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/">Home</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/profile">Profile</Link>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="outline">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

