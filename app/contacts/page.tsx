import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactsForm } from "@/components/contacts-form"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"

export default async function ContactsPage() {
  let user = null
  let contacts = null

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

      contacts = contactsData
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
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <DashboardNav user={user} />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-5xl py-8 px-4">
          <h1 className="text-3xl font-medium mb-8">Emergency Contacts</h1>
          <Card className="max-w-2xl mx-auto bg-sage-100 border-none">
            <CardHeader>
              <CardTitle>Your Emergency Contacts</CardTitle>
              <CardDescription>Add and manage your emergency contacts who will be notified when an alert is created</CardDescription>
            </CardHeader>
            <CardContent>
              {user && <ContactsForm user={user} contacts={contacts} />}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 