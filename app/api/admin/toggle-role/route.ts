import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Get current user's role to verify they're an admin
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()
    
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { error: "Only admins can modify user roles" },
        { status: 403 }
      )
    }
    
    // Get the user ID from the query parameter
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID" },
        { status: 400 }
      )
    }
    
    // Get the user's current role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (!userProfile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Toggle the role between 'admin' and 'member'
    const newRole = userProfile.role === 'admin' ? 'member' : 'admin'
    
    // Update the user's role
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Return success response and redirect back to the users page
    return NextResponse.redirect(new URL('/admin/users', request.url))
  } catch (error: any) {
    console.error("Error in toggle-role API route:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    )
  }
} 