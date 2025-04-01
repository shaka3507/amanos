import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Define admin-only routes
const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/settings',
  '/admin/alerts',
  '/admin/alerts/create',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only check admin routes
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    try {
      // Check if the user is authenticated and has admin role
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      
      if (!user) {
        // Redirect to sign-in if not authenticated
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }
      
      // Get user role from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      // If not admin, redirect to unauthorized page
      if (!profileData || profileData.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Error in middleware:', error)
      // Redirect to sign-in on error
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }
  
  return NextResponse.next()
}

// Configure the middleware to run only for specific paths
export const config = {
  matcher: [
    '/admin/:path*', // Match all admin routes
  ],
} 