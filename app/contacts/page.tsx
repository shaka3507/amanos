import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactsForm } from "@/components/contacts-form"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { User, Phone } from "lucide-react"
import { ContactsList } from "@/components/contacts-list"
import { ProfileForm } from "@/components/profile-form"

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  relationship: string
}

interface Profile {
  id: string
  full_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  role?: string
}

export default async function ContactsPage() {
  let user = null
  let contacts: Contact[] | null = null
  let profile: Profile | null = null
  let isAdmin = false

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (!user) {
        redirect("/sign-in")
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      profile = profileData
      isAdmin = profile?.role === 'admin'

      // Get emergency contacts
      const { data: contactsData } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false })

      // Ensure data conforms to Contact interface
      contacts = contactsData ? contactsData.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email || "",
        relationship: contact.relationship || ""
      })) : null
    } else {
      redirect("/sign-in")
    }
  } catch (error) {
    console.error("Error in ContactsPage:", error)
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
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
          <h1 className="text-3xl font-medium mb-8">My Contact Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - User Profile Form */}
            <Card className="bg-yellow-200 border-2 border-black shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <CardTitle className="text-black">My Information</CardTitle>
                </div>
                <CardDescription className="text-black/80">
                  Update your personal contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white border-t-2 border-black pt-6">
                {user && profile && <ProfileForm user={user} profile={profile} />}
              </CardContent>
            </Card>

            {/* Right column - Emergency Contact Form */}
            <Card className="bg-blue-200 border-2 border-black shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <CardTitle className="text-black">Emergency Contact</CardTitle>
                </div>
                <CardDescription className="text-black/80">
                  This person will be notified when you create an alert
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white border-t-2 border-black pt-6">
                {user && <ContactsForm 
                  user={user} 
                  contacts={contacts} 
                  maxContacts={isAdmin ? 5 : 1} 
                />}
              </CardContent>
            </Card>
          </div>

          {/* If user has contacts, show them */}
          {contacts && contacts.length > 0 && (
            <Card className="border-2 border-black shadow-lg mt-8">
              <CardHeader className="bg-green-300">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-black">
                    {isAdmin ? 'My Emergency Contacts' : 'My Emergency Contact'}
                  </CardTitle>
                </div>
                <CardDescription className="text-black/90">
                  {isAdmin 
                    ? 'People who will be notified during emergencies' 
                    : 'Person who will be notified during emergencies'}
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white border-t-2 border-black pt-6">
                <ContactsList contacts={contacts} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 