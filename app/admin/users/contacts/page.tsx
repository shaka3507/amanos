import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminContactsForm } from "@/components/admin/admin-contacts-form"
import { AdminContactsList } from "@/components/admin/admin-contacts-list"

interface Contact {
  id: string
  user_id: string
  name: string
  phone: string
  email: string
  relationship: string
  created_by: string
  created_at: string
}

export default async function AdminContactsPage() {
  let user = null
  let contacts: Contact[] = []
  let users: any[] = []

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      // Get all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*, auth_user:id(email)')
        .order('created_at', { ascending: false })
      
      users = usersData || []

      // Get all contacts in the system
      const { data: contactsData } = await supabase
        .from("emergency_contacts")
        .select("*, user_profile:user_id(full_name, email), creator:created_by(full_name, email)")
        .order('created_at', { ascending: false })
      
      contacts = contactsData || []
    }
  } catch (error) {
    console.error("Error in AdminContactsPage:", error)
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
            <Link href="/admin/users" className="mr-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Emergency Contacts Management</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Admin Contact Form */}
            <Card className="bg-blue-200 border-2 border-black shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-black">Add/Edit Contact</CardTitle>
                </div>
                <CardDescription className="text-black/80">
                  Manage emergency contacts for any user
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white border-t-2 border-black pt-6">
                {user && <AdminContactsForm user={user} users={users} />}
              </CardContent>
            </Card>

            {/* Recent Contacts */}
            <Card className="border-2 border-black shadow-lg">
              <CardHeader className="bg-green-300">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-black">Recent Contacts</CardTitle>
                </div>
                <CardDescription className="text-black/90">
                  Recently added emergency contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white border-t-2 border-black pt-6">
                {contacts.slice(0, 5).map((contact) => (
                  <div 
                    key={contact.id} 
                    className="mb-4 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">For user: {contact.user_profile?.full_name || contact.user_profile?.email || 'Unknown user'}</div>
                        <div className="text-sm text-muted-foreground">{contact.phone}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Added {new Date(contact.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* All Contacts Table */}
          <Card className="border-2 border-black shadow-lg mb-8">
            <CardHeader className="bg-blue-100">
              <CardTitle>All Emergency Contacts</CardTitle>
              <CardDescription>
                All contacts in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-white border-t-2 border-black overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">For User</th>
                      <th className="px-4 py-3 text-left">Created By</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{contact.name}</td>
                        <td className="px-4 py-3">{contact.phone}</td>
                        <td className="px-4 py-3">{contact.email}</td>
                        <td className="px-4 py-3">{contact.user_profile?.full_name || contact.user_profile?.email || 'Unknown'}</td>
                        <td className="px-4 py-3">{contact.creator?.full_name || contact.creator?.email || 'Unknown'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              // This will be handled client-side
                              document.dispatchEvent(new CustomEvent('edit-admin-contact', { 
                                detail: { contactId: contact.id }
                              }));
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500"
                            onClick={() => {
                              // This will be handled client-side
                              document.dispatchEvent(new CustomEvent('delete-admin-contact', { 
                                detail: { contactId: contact.id }
                              }));
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {contacts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          <Phone className="mx-auto h-8 w-8 mb-2 opacity-30" />
                          <p>No emergency contacts found in the system</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
} 