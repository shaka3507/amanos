import { createBrowserClient } from "@supabase/ssr"
import { supabaseUrl, supabaseAnonKey } from "@/app/env"

export function createClient() {
  // Only create the client if we're in a browser environment
  if (typeof window === "undefined") {
    return null
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return null
  }
}

