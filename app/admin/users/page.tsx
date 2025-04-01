import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Shield } from "lucide-react"

export default async function AdminUsersPage() {
  let user = null
  let users: any[] = []

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      // Get all users with their profiles
      const { data } = await supabase
        .from('profiles')
        .select('*, auth_user:id(email)')
        .order('created_at', { ascending: false })
      
      users = data || []
    }
  } catch (error) {
    console.error("Error in AdminUsersPage:", error)
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

      <main className="flex-1">
        <div className="container max-w-5xl py-8 px-4">
          <div className="flex items-center mb-8">
            <Link href="/admin" className="mr-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>

          <div className="bg-white border-2 border-black rounded-md overflow-hidden">
            <div className="grid grid-cols-12 bg-blue-100 px-4 py-3 border-b border-gray-200">
              <div className="col-span-1 font-medium text-left"></div>
              <div className="col-span-3 font-medium text-left">Name</div>
              <div className="col-span-4 font-medium text-left">Email</div>
              <div className="col-span-2 font-medium text-left">Role</div>
              <div className="col-span-2 font-medium text-right">Actions</div>
            </div>
            
            <div className="divide-y">
              {users.map((profileUser) => (
                <div key={profileUser.id} className="grid grid-cols-12 px-4 py-3 items-center">
                  <div className="col-span-1">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="col-span-3">{profileUser.name || profileUser.full_name || 'User'}</div>
                  <div className="col-span-4">{profileUser.auth_user?.email || 'No email'}</div>
                  <div className="col-span-2 flex items-center">
                    {profileUser.role === 'admin' ? (
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-blue-500 font-medium">Admin</span>
                      </div>
                    ) : (
                      <span>Member</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <form action={`/api/admin/toggle-role?userId=${profileUser.id}`} method="POST">
                      <Button 
                        type="submit" 
                        variant="outline" 
                        size="sm"
                      >
                        {profileUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </form>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">
                  No users found
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