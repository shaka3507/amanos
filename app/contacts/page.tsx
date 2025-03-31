import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactsForm } from "@/components/contacts-form"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { User, Phone } from "lucide-react"
import { ContactsList } from "@/components/contacts-list"

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  relationship: string
}

export default async function ContactsPage() {
  let user = null
  let contacts: Contact[] | null = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (!user) {
        redirect("/sign-in")
      }

      const { data: contactsData } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)

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
          <h1 className="text-3xl font-medium mb-8">Emergency Contacts</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Contact Form */}
            <Card className="bg-blue-200 border-2 border-black shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-black">New Contact +</CardTitle>
                </div>
                <CardDescription className="text-black/80">
                  These people will be notified when you create an alert
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white border-t-2 border-black pt-6">
                {user && <ContactsForm user={user} contacts={contacts} />}
              </CardContent>
            </Card>

            {/* Right column - Contacts List */}
            <Card className="bg-green-300 border-2 border-black shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-black">Contacts</CardTitle>
                </div>
                <CardDescription className="text-black/90">
                  People who will be notified during emergencies
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white border-t-2 border-black pt-6">
                <ContactsList contacts={contacts} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 