import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AddItemForm } from "@/components/add-item-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AddItemPage() {
  let user = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser()
      user = userData?.user

      if (!user) {
        redirect("/sign-in")
      }
    } else {
      redirect("/sign-in")
    }
  } catch (error) {
    console.error("Error in AddItemPage:", error)
    redirect("/dashboard")
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      <h1 className="text-3xl font-medium mb-8">Add New Item</h1>
      <Card className="max-w-2xl mx-auto bg-sage-100 border-none">
        <CardHeader>
          <CardTitle>Create Item</CardTitle>
          <CardDescription>Add a new item to your collection</CardDescription>
        </CardHeader>
        <CardContent>{user && <AddItemForm userId={user.id} />}</CardContent>
      </Card>
    </div>
  )
}

