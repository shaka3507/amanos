import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

// Interface for the request body
interface MessageRequest {
  alertId: string
  messageText: string
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
    const { alertId, messageText } = await request.json() as MessageRequest

    // Validate request
    if (!alertId || !messageText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get alert details
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .select('*, groups(*)')
      .eq('id', alertId)
      .single()

    if (alertError || !alertData) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      )
    }

    // Verify user is in the alert's group
    const { data: groupMember, error: groupError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', alertData.group_id)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (groupError || !groupMember) {
      return NextResponse.json(
        { error: "You are not authorized to send messages to this group" },
        { status: 403 }
      )
    }

    // Get the user's profile data for sender information
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userData.user.id)
      .single()

    const senderName = senderProfile?.full_name || userData.user.email || 'A group member'

    // First save the message in the database
    const { data: messageData, error: messageError } = await supabase
      .from('alert_messages')
      .insert([{
        alert_id: alertId,
        user_id: userData.user.id,
        message: messageText,
        is_system_message: false,
      }])
      .select()
      .single()

    if (messageError) {
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      )
    }

    // Get all recipients for this alert (both group members and emergency contacts)
    const { data: recipients, error: recipientsError } = await supabase
      .from('group_alert_recipients')
      .select(`
        *,
        emergency_contacts(id, name, email),
        profiles:user_id(id, full_name, email)
      `)
      .eq('alert_id', alertId)

    if (recipientsError) {
      return NextResponse.json(
        { error: "Failed to get recipients" },
        { status: 500 }
      )
    }

    // Mailgun API configuration
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN
    
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error("Mailgun configuration missing")
      return NextResponse.json(
        { error: "Email service not configured, but message was saved" },
        { status: 207 }  // Partial success
      )
    }

    // Initialize Mailgun client
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY })

    // Prepare the email
    const shortAlertTitle = alertData.title.length > 30 
      ? `${alertData.title.substring(0, 30)}...` 
      : alertData.title

    const emailSubject = `New message about: ${shortAlertTitle}`
    
    // Send to all recipients
    const emailPromises = recipients.map(recipient => {
      // Determine recipient information
      let to, recipientName
      
      if (recipient.emergency_contacts) {
        to = recipient.emergency_contacts.email
        recipientName = recipient.emergency_contacts.name
      } else if (recipient.profiles) {
        to = recipient.profiles.email
        recipientName = recipient.profiles.full_name
      } else {
        return Promise.resolve() // Skip if no valid recipient
      }
      
      if (!to) return Promise.resolve() // Skip if no email

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #3b82f6;">
            <h2>New message from ${senderName}</h2>
            <p style="font-size: 16px; background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              "${messageText}"
            </p>
            <p>This message is regarding the alert: <strong>${alertData.title}</strong></p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/alerts/${alertId}" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">
              View Discussion & Respond
            </a>
            <p style="color: #666; margin-top: 30px; font-size: 14px;">
              You're receiving this because you're involved with this alert.
              <br />
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/alerts/${alertId}">
                View all messages
              </a>
            </p>
          </div>
        </div>
      `

      // Send email
      return mg.messages.create(MAILGUN_DOMAIN, {
        from: "Amanos Alerts <alerts@amanos.app>",
        to,
        subject: emailSubject,
        html: emailHtml
      }).catch(error => {
        console.error(`Error sending email to ${to}:`, error)
        return null // Continue with other emails even if one fails
      })
    })

    try {
      // Send all emails in parallel
      await Promise.all(emailPromises.filter(Boolean))
      
      // Return success
      return NextResponse.json({ 
        success: true, 
        message: "Message sent successfully",
        messageId: messageData.id
      }, { status: 200 })
    } catch (error) {
      console.error("Error sending emails:", error)
      return NextResponse.json({ 
        success: true, 
        message: "Message saved but some notifications failed",
        messageId: messageData.id
      }, { status: 207 }) // Partial success
    }
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 