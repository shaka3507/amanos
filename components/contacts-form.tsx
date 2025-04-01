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
import { Switch } from "@/components/ui/switch"

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  relationship: string
}

export function ContactsForm({ user, contacts, maxContacts = 1 }: { user: any; contacts: Contact[] | null; maxContacts?: number }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [relationship, setRelationship] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [currentContactId, setCurrentContactId] = useState<string | null>(null)
  const [createAccount, setCreateAccount] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const router = useRouter()

  // Calculate if contact limit is reached
  const isLimitReached = contacts && contacts.length >= maxContacts

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
    setCreateAccount(false)
    setInviteSent(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    setInviteSent(false)

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Could not initialize Supabase client")
      }

      // Check if in edit mode or if contact limit is reached
      if (!editMode && isLimitReached) {
        throw new Error(`You can only have ${maxContacts} emergency contact${maxContacts === 1 ? '' : 's'}`)
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
            // Don't update created_by in edit mode
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

      // Create user account if requested
      let contactUserId = null
      if (createAccount) {
        // Check if user already exists
        const { data: existingUserData, error: existingUserError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        
        if (existingUserError && !existingUserError.message.includes('No rows found')) {
          setError(existingUserError.message)
          setLoading(false)
          return
        }
        
        if (existingUserData) {
          // User already exists
          contactUserId = existingUserData.id
        } else {
          // Generate a random password (user will reset via email)
          const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
          
          // Create new user
          const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: tempPassword,
            options: {
              data: {
                full_name: name,
                phone: phone
              }
            }
          })
          
          if (signUpError) {
            // Handle error but continue - we'll still add them as a contact
            console.error("Error creating user account:", signUpError)
          } else if (newUserData?.user) {
            contactUserId = newUserData.user.id
            setInviteSent(true)
          }
        }
      }

      // Otherwise, insert a new contact
      const { error, data } = await supabase.from("emergency_contacts").insert({
        user_id: user.id,
        created_by: user.id, // Add the created_by field
        name,
        phone,
        email,
        relationship,
        auth_user_id: contactUserId // Link to auth user if created
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
            inviteType: createAccount ? 'account' : 'contact'
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

      const accountMsg = inviteSent ? " and user account created" : ""
      setMessage(`Contact added successfully${accountMsg}`)
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
        {message && (
          <Alert className="mb-4 bg-green-100 text-green-800 border border-green-200">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="mb-4 bg-red-100 text-red-800 border border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!editMode && isLimitReached ? (
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
            <p className="text-muted-foreground mb-2">
              You've reached the maximum number of emergency contacts ({maxContacts}).
            </p>
            <p className="text-sm">
              Edit or delete an existing contact from below.
            </p>
          </div>
        ) : (
          <>
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
            
            {!editMode && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="create-account"
                  checked={createAccount}
                  onCheckedChange={setCreateAccount}
                />
                <Label htmlFor="create-account" className="cursor-pointer">
                  Create user account for this contact
                </Label>
              </div>
            )}
            
            {createAccount && !editMode && (
              <div className="bg-blue-50 p-3 rounded-md text-sm">
                An invitation will be sent to {email} to set up their Amanos account.
              </div>
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
          </>
        )}
      </form>
    </div>
  )
} 