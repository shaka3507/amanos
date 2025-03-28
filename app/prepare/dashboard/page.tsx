import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
    <div className="container max-w-5xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-medium">Dashboard</h1>
        <Button asChild className="bg-sage-400 hover:bg-sage-500 text-black">
          <Link href="/add-item" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.length > 0 ? (
          items.map((item: any) => (
            <Card key={item.id} className="bg-sage-100 border-none">
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
          <Card className="col-span-full bg-sage-100 border-none">
            <CardHeader>
              <CardTitle>No items found</CardTitle>
              <CardDescription>You haven&apos;t created any items yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-sage-300 hover:bg-sage-400 text-black">
                <Link href="/add-item">Create Your First Item</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

