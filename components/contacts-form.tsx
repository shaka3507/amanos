"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit } from "lucide-react"

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
  const [editMode, setEditMode] = useState(false)
  const [currentContactId, setCurrentContactId] = useState<string | null>(null)
  const router = useRouter()

  // Listen for edit-contact events from the contacts list
  useEffect(() => {
    const handleEditContactEvent = (e: CustomEvent) => {
      const { contactId } = e.detail;
      const contact = contacts?.find(c => c.id === contactId);
      if (contact) {
        handleEditContact(contact);
      }
    };

    // Add event listener
    document.addEventListener('edit-contact', handleEditContactEvent as EventListener);

    // Clean up event listener
    return () => {
      document.removeEventListener('edit-contact', handleEditContactEvent as EventListener);
    };
  }, [contacts]);

  // Listen for delete-contact events from the contacts list
  useEffect(() => {
    const handleDeleteContactEvent = (e: CustomEvent) => {
      const { contactId } = e.detail;
      if (contactId) {
        handleDelete(contactId);
      }
    };

    // Add event listener
    document.addEventListener('delete-contact', handleDeleteContactEvent as EventListener);

    // Clean up event listener
    return () => {
      document.removeEventListener('delete-contact', handleDeleteContactEvent as EventListener);
    };
  }, []);

  const resetForm = () => {
    setName("")
    setPhone("")
    setEmail("")
    setRelationship("")
    setEditMode(false)
    setCurrentContactId(null)
  }

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

      // If in edit mode, update the existing contact
      if (editMode && currentContactId) {
        const { error } = await supabase
          .from("emergency_contacts")
          .update({
            name,
            phone,
            email,
            relationship,
          })
          .eq("id", currentContactId)
          .eq("user_id", user.id)

        if (error) {
          setError(error.message)
          return
        }

        setMessage("Contact updated successfully")
        resetForm()
        router.refresh()
        return
      }

      // Otherwise, insert a new contact
      const { error, data } = await supabase.from("emergency_contacts").insert({
        user_id: user.id,
        name,
        phone,
        email,
        relationship,
      }).select()

      if (error) {
        setError(error.message)
        return
      }

      // Send invitation email
      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            name: name,
          }),
        })

        if (!emailResponse.ok) {
          console.warn('Failed to send invitation email:', await emailResponse.text())
          // Continue despite email failure
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Continue despite email failure
      }

      setMessage("Contact added successfully")
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    setMessage(null)
    setError(null)
  }

  const handleEditContact = (contact: Contact) => {
    setName(contact.name)
    setPhone(contact.phone)
    setEmail(contact.email)
    setRelationship(contact.relationship)
    setCurrentContactId(contact.id)
    setEditMode(true)
    setMessage(null)
    setError(null)
    
    // Scroll to the form
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })
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
      
      // If we're currently editing this contact, reset the form
      if (currentContactId === contactId) {
        resetForm()
      }
      
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
        <div className="flex gap-2">
          <Button type="submit" className={`flex-1 ${editMode ? 'bg-green-400 hover:bg-green-500' : 'bg-blue-400 hover:bg-blue-500'} text-black`} disabled={loading}>
            {loading ? "Processing..." : editMode ? "Update Contact" : "Add Contact"}
          </Button>
          {editMode && (
            <Button type="button" onClick={handleCancel} variant="outline" className="border-2 border-black">
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
} 