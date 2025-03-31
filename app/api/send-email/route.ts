import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

// Interface for the request body
interface EmailRequest {
  to: string
  name: string
  from?: string
}

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

    // Get request body
    const { to, name, from = "Amanos Team <noreply@amanos.app>" } = await request.json() as EmailRequest

    // Validate email
    if (!to || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Mailgun API configuration
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN
    
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error("Mailgun configuration missing")
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      )
    }

    // Initialize Mailgun client
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY })

    // Create email data
    const data = {
      from,
      to,
      subject: `${name}, you've been added as an emergency contact on Amanos`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>You have been added as an emergency contact by ${userData.user.email || "a user"} on Amanos - a crisis management platform.</p>
          <p>In the event of an emergency, you may receive notifications to help coordinate response efforts.</p>
          <p style="margin-top: 30px;">Want to join Amanos yourself?</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-up" 
             style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Create Your Account
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            If you believe this was sent in error, please disregard this email.
          </p>
        </div>
      `
    }

    // Send email
    try {
      const response = await mg.messages.create(MAILGUN_DOMAIN, data)
      return NextResponse.json({ success: true, messageId: response.id }, { status: 200 })
    } catch (error: any) {
      console.error("Mailgun error:", error)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 