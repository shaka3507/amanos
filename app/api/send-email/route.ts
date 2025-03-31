import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

// Interface for the request body
interface EmailRequest {
  to: string
  name: string
  from?: string
  inviteType?: 'contact' | 'account' | 'alert'
  alertData?: {
    title: string
    description: string
    alertId: string
  }
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
    const { 
      to, 
      name, 
      from = "Amanos Team <noreply@amanos.app>",
      inviteType = 'contact',
      alertData
    } = await request.json() as EmailRequest

    // Validate email
    if (!to || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get sender's profile information
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userData.user.id)
      .single();

    const senderName = senderProfile?.full_name || userData.user.email || "An Amanos user";

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

    // Set email subject and content based on invitation type
    let subject, html;
    
    switch (inviteType) {
      case 'account':
        subject = `${name}, you've been invited to join Amanos by ${senderName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${name},</h2>
            <p>${senderName} has invited you to join Amanos - a crisis management platform.</p>
            <p>They've already added you as an emergency contact and created an account for you.</p>
            <p>Click the button below to set up your password and access your account:</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-in?email=${encodeURIComponent(to)}" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">
              Set Up Your Account
            </a>
            <p>With Amanos, you can:</p>
            <ul style="margin-bottom: 20px;">
              <li>Receive alerts during emergencies</li>
              <li>Coordinate crisis response with your contacts</li>
              <li>Track and share resources needed during emergencies</li>
            </ul>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you believe this was sent in error, please disregard this email.
            </p>
          </div>
        `;
        break;
        
      case 'alert':
        if (!alertData) {
          return NextResponse.json(
            { error: "Missing alert data" },
            { status: 400 }
          )
        }
        
        subject = `ALERT: ${alertData.title} - Emergency notification from ${senderName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ef4444; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold;">
              EMERGENCY ALERT
            </div>
            <div style="padding: 20px; border: 1px solid #ef4444;">
              <h2>${alertData.title}</h2>
              <p style="font-size: 16px;">${alertData.description}</p>
              <p style="font-weight: bold;">This alert was sent by ${senderName}.</p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/alerts/${alertData.alertId}" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">
                View Alert Details
              </a>
              <p style="color: #666; margin-top: 30px; font-size: 14px;">
                You're receiving this because you're listed as an emergency contact. 
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-up">Create an account</a> 
                to respond directly to this alert.
              </p>
            </div>
          </div>
        `;
        break;
        
      case 'contact':
      default:
        subject = `${name}, you've been added as an emergency contact on Amanos`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${name},</h2>
            <p>You have been added as an emergency contact by ${senderName} on Amanos - a crisis management platform.</p>
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
        `;
    }

    // Create email data
    const data = {
      from,
      to,
      subject,
      html
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