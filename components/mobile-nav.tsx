"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileNav({ user }: { user: any }) {
  const [isOpen, setIsOpen] = React.useState(false)

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
            
            <form action="/api/auth/signout" method="post" className="w-full">
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full text-lg font-medium hover:text-red-500 transition-colors"
                >
                sign out 
                - {user && user.email}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 