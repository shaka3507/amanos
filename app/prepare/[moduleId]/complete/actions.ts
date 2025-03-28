"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

const modules = {
  "emergency-basics": {
    badgeId: "emergency-basics-badge"
  },
  "first-aid": {
    badgeId: "first-aid-badge"
  },
  "home-safety": {
    badgeId: "home-safety-badge"
  },
  "emergency-planning": {
    badgeId: "emergency-planning-badge"
  }
}

export async function completeModule(moduleId: string) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      throw new Error("Unauthorized")
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      throw new Error("Unauthorized")
    }

    const module = modules[moduleId as keyof typeof modules]
    if (!module) {
      throw new Error("Module not found")
    }

    // Check if user already has this badge
    const { data: existingBadge } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userData.user.id)
      .eq("badge_id", module.badgeId)
      .single()

    if (existingBadge) {
      throw new Error("Badge already earned")
    }

    // Add the badge to user_badges
    const { error } = await supabase.from("user_badges").insert([
      {
        user_id: userData.user.id,
        badge_id: module.badgeId,
        earned_at: new Date().toISOString()
      }
    ])

    if (error) {
      console.error("Error adding badge:", error)
      throw new Error("Failed to complete module")
    }

    revalidatePath("/prepare")
    revalidatePath(`/prepare/${moduleId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error in completeModule:", error)
    throw error
  }
} 