"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

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
  share_zipcode?: boolean
}

export function ProfileForm({ user, profile }: { user: any; profile: Profile }) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [address, setAddress] = useState(profile?.address || "")
  const [city, setCity] = useState(profile?.city || "")
  const [state, setState] = useState(profile?.state || "")
  const [zip, setZip] = useState(profile?.zip || "")
  const [shareZipcode, setShareZipcode] = useState(profile?.share_zipcode || false)
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

      // Update the profile
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          address,
          city,
          state,
          zip,
          share_zipcode: shareZipcode,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) {
        setError(error.message)
        return
      }

      setMessage("Profile updated successfully")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            readOnly
            disabled
            className="mt-1 bg-gray-100"
          />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
        </div>

        <div>
          <Label htmlFor="full-name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1"
            required
          />
        </div>

        <div>
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
            placeholder="e.g. (123) 456-7890"
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1"
            placeholder="Street address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1"
              placeholder="e.g. CA"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="mt-1"
            placeholder="e.g. 94043"
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="share-zipcode"
            checked={shareZipcode}
            onCheckedChange={setShareZipcode}
          />
          <Label htmlFor="share-zipcode" className="cursor-pointer">
            Share ZIP code with administrators
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This allows admins to see your ZIP code for emergency planning purposes
        </p>

        <Button
          type="submit"
          className="bg-blue-500 text-white hover:bg-blue-600 w-full mt-4"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Profile"}
        </Button>
      </div>
    </form>
  )
}

