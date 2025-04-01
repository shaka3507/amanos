"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, User } from "lucide-react"

interface Contact {
  id: string
  user_id: string
  name: string
  phone: string
  email: string
  relationship: string
}

interface User {
  id: string
  full_name?: string
  email?: string
  auth_user?: {
    email?: string
  }
}

export function AdminContactsForm({ user, users }: { user: any; users: User[] }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [relationship, setRelationship] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [currentContactId, setCurrentContactId] = useState<string | null>(null)
  const router = useRouter()

  // Listen for edit-admin-contact events from the contacts list
  useEffect(() => {
    const handleEditContactEvent = async (e: CustomEvent) => {
      const { contactId } = e.detail;
      if (contactId) {
        await fetchContactDetails(contactId);
      }
    };

    // Add event listener
    document.addEventListener('edit-admin-contact', handleEditContactEvent as EventListener);

    // Clean up event listener
    return () => {
      document.removeEventListener('edit-admin-contact', handleEditContactEvent as EventListener);
    };
  }, []);

  // Listen for delete-admin-contact events
  useEffect(() => {
    const handleDeleteContactEvent = (e: CustomEvent) => {
      const { contactId } = e.detail;
      if (contactId) {
        handleDelete(contactId);
      }
    };

    // Add event listener
    document.addEventListener('delete-admin-contact', handleDeleteContactEvent as EventListener);

    // Clean up event listener
    return () => {
      document.removeEventListener('delete-admin-contact', handleDeleteContactEvent as EventListener);
    };
  }, []);

  const fetchContactDetails = async (contactId: string) => {
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Could not initialize Supabase client");
      }

      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("id", contactId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setName(data.name);
        setPhone(data.phone);
        setEmail(data.email || "");
        setRelationship(data.relationship || "");
        setSelectedUserId(data.user_id);
        setCurrentContactId(data.id);
        setEditMode(true);
      }
    } catch (err: any) {
      console.error("Error fetching contact:", err);
      setError(err.message || "An error occurred while fetching contact details");
    }
  };

  const resetForm = () => {
    setName("")
    setPhone("")
    setEmail("")
    setRelationship("")
    setSelectedUserId("")
    setEditMode(false)
    setCurrentContactId(null)
    setError(null)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (!selectedUserId) {
        throw new Error("Please select a user for this contact")
      }

      const supabase = createClient()
      if (!supabase) {
        throw new Error("Could not initialize Supabase client")
      }

      // If in edit mode, update the existing contact
      if (editMode && currentContactId) {
        const { error } = await supabase
          .from("emergency_contacts")
          .update({
            user_id: selectedUserId,
            name,
            phone,
            email,
            relationship,
            // Don't update created_by in edit mode
          })
          .eq("id", currentContactId)

        if (error) {
          setError(error.message)
          return
        }

        setMessage("Contact updated successfully")
        resetForm()
        router.refresh()
        return
      }

      // Insert a new contact
      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: selectedUserId,
        created_by: user.id, // Current admin user
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
  }

  const handleDelete = async (contactId: string) => {
    if (!contactId) return;
    
    if (!window.confirm("Are you sure you want to delete this contact?")) {
      return;
    }
    
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Could not initialize Supabase client");
      }

      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", contactId);

      if (error) {
        throw error;
      }

      // Clear form if deleting the currently edited contact
      if (contactId === currentContactId) {
        resetForm();
      }
      
      setMessage("Contact deleted successfully");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the contact");
      console.error("Error deleting contact:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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

      <div className="mb-4">
        <Label htmlFor="user-select">
          Select User <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedUserId}
          onValueChange={setSelectedUserId}
        >
          <SelectTrigger id="user-select" className="w-full">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((profileUser) => (
              <SelectItem key={profileUser.id} value={profileUser.id}>
                {profileUser.full_name || profileUser.auth_user?.email || 'User'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <Label htmlFor="name">
          Contact Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
          required
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="phone">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1"
          required
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="relationship">Relationship</Label>
        <Input
          id="relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="mt-1"
          placeholder="e.g. Family, Friend, Neighbor"
        />
      </div>

      <div className="flex justify-between mt-6">
        {editMode ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 text-white hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Contact"}
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            className="bg-blue-500 text-white hover:bg-blue-600 w-full"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Contact"}
          </Button>
        )}
      </div>
    </form>
  )
} 