"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, User, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export function MobileNav({ user }: { user: any }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if user has admin role
    const checkAdminRole = async () => {
      if (user?.id) {
        try {
          const supabase = createClient()
          if (supabase) {
            const { data } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            
            setIsAdmin(data?.role === 'admin')
          }
        } catch (error) {
          console.error("Error checking admin role:", error)
        }
      }
    }
    
    checkAdminRole()
  }, [user])

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden -mr-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-12 w-12" />
        ) : (
          <Menu className="h-12 w-12" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b z-50">
          <div className="flex flex-col items-center p-4 space-y-4">
            <Link 
              href="/" 
              className="text-lg font-medium hover:text-red-500 transition-colors w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/prepare" 
              className="text-lg font-medium hover:text-red-500 transition-colors w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              Prepare
            </Link>
            <Link 
              href="/contacts" 
              className="text-lg font-medium hover:text-red-500 transition-colors w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              Contacts
            </Link>
            <Link 
              href="/faq" 
              className="text-lg font-medium hover:text-red-500 transition-colors w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </Link>
            
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-lg font-medium hover:text-red-500 transition-colors w-full text-center flex items-center justify-center"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 