import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"

export default async function DashboardPage() {
  let user = null
  let items = []

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      items = itemsData || []
    }
  } catch (error) {
    console.error("Error in DashboardPage:", error)
    items = []
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav user={user} />
          <div className="mr-4 hidden md:flex">
            <DashboardNav user={user} />
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-medium">Dashboard</h1>
          <Button asChild className="bg-blue-400 hover:bg-blue-500 text-black transform transition-transform hover:translate-x-1 hover:translate-y-1">
            <Link href="/add-item" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.length > 0 ? (
            items.map((item: any) => (
              <Card key={item.id} className="bg-blue-100 border-2 border-black">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>Created on {new Date(item.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{item.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full bg-blue-100 border-2 border-black">
              <CardHeader>
                <CardTitle>No items found</CardTitle>
                <CardDescription>You haven&apos;t created any items yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="bg-blue-300 hover:bg-blue-400 text-black transform transition-transform hover:translate-x-1 hover:translate-y-1">
                  <Link href="/add-item">Create Your First Item</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
}

