import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

interface Member {
  name: string;
  email: string;
  phone: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { message: "Could not initialize database client" },
        { status: 500 }
      );
    }

    // Get user for permission check
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the request data
    const { alertId, groupId, members } = await request.json();

    if (!alertId || !groupId || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Check if the user is an admin for this group
    const { data: memberData } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", userData.user.id)
      .single();

    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json(
        { message: "Only group admins can upload members" },
        { status: 403 }
      );
    }

    // Get alert info for invitation purposes
    const { data: alertData } = await supabase
      .from("alerts")
      .select("title, description")
      .eq("id", alertId)
      .single();

    if (!alertData) {
      return NextResponse.json(
        { message: "Alert not found" },
        { status: 404 }
      );
    }

    // Process members
    const results = {
      added: 0,
      invited: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const member of members) {
      try {
        if (!member.email || !isValidEmail(member.email) || !member.name || !member.phone) {
          throw new Error(`Invalid member data: ${JSON.stringify(member)}`);
        }

        // Check if user already exists
        const { data: existingUsers } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", member.email.toLowerCase())
          .maybeSingle();

        if (existingUsers?.id) {
          // User exists, add to group if not already a member
          const { data: existingMember } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", groupId)
            .eq("user_id", existingUsers.id)
            .maybeSingle();

          if (!existingMember) {
            // Add user to group
            await supabase.from("group_members").insert({
              group_id: groupId,
              user_id: existingUsers.id,
              role: "member",
            });
          }
          results.added++;
        } else {
          // User doesn't exist, create invitation
          const { data: invitation, error } = await supabase
            .from("alert_invitations")
            .insert({
              alert_id: alertId,
              group_id: groupId,
              name: member.name,
              email: member.email.toLowerCase(),
              phone: member.phone,
              invited_by: userData.user.id,
              status: "pending",
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to create invitation: ${error.message}`);
          }

          // Send invitation email
          await sendInvitationEmail(invitation, alertData.title);
          results.invited++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row for ${member.email || "unknown"}: ${error.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error in upload-members API:", error);
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Helper function to send invitation email
async function sendInvitationEmail(invitation: any, alertTitle: string) {
  // Always log the invitation for debugging
  console.log("Invitation details:", {
    to: invitation.email,
    subject: `You've been invited to join a crisis alert: ${alertTitle}`,
    invitationId: invitation.id,
    token: invitation.token
  });

  // Check environment - only send actual emails in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    console.log("📧 Development mode - skipping email send");
    console.log("📧 Would have sent invitation to:", invitation.email);
    console.log("📧 Link would be:", `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/join-alert/${invitation.token}`);
    return true;
  }
  
  // Production email sending
  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
  
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn("⚠️ Mailgun configuration missing, skipping email send");
    return true;
  }

  try {
    // Initialize Mailgun client
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });

    // Create email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to join a crisis alert</h2>
        <p>You've been invited to join <strong>${alertTitle}</strong> on Amanos - a crisis management platform.</p>
        <p>Click the button below to accept this invitation:</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/join-alert/${invitation.token}" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">
          Accept Invitation
        </a>
        <p>With Amanos, you can:</p>
        <ul style="margin-bottom: 20px;">
          <li>Receive alerts during emergencies</li>
          <li>Coordinate crisis response with your community</li>
          <li>Access resources and support during critical situations</li>
        </ul>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          If you believe this was sent in error, please disregard this email.
        </p>
      </div>
    `;

    // Send email
    const response = await mg.messages.create(MAILGUN_DOMAIN, {
      from: "Amanos Alerts <alerts@amanos.app>",
      to: invitation.email,
      subject: `You've been invited to join a crisis alert: ${alertTitle}`,
      html: html
    });
    
    console.log("✅ Email sent successfully:", response.id);
    return true;
  } catch (error) {
    console.error("❌ Error sending invitation email:", error);
    return true; // Still return true so the process continues even if email fails
  }
} 