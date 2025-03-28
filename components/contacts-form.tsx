"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  relationship: string
}

export function ContactsForm({ user, contacts }: { user: any; contacts: Contact[] | null }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [relationship, setRelationship] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Could not initialize Supabase client")
      }

      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: user.id,
        name,
        phone,
        email,
        relationship,
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage("Contact added successfully")
      setName("")
      setPhone("")
      setEmail("")
      setRelationship("")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (contactId: string) => {
    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Could not initialize Supabase client")
      }

      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", contactId)

      if (error) {
        setError(error.message)
        return
      }

      setMessage("Contact deleted successfully")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact's full name"
            required
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contact's phone number"
            required
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Contact's email address"
            required
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship</Label>
          <Input
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g., Family, Friend, Neighbor"
            required
            className="bg-white"
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full bg-red-400 hover:bg-red-500 text-black" disabled={loading}>
          {loading ? "Adding..." : "Add Contact"}
        </Button>
      </form>

      {contacts && contacts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Your Contacts</h2>
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-muted-foreground">{contact.relationship}</div>
                  <div className="text-sm text-muted-foreground">{contact.phone}</div>
                  <div className="text-sm text-muted-foreground">{contact.email}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 