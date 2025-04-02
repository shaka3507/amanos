import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Get the token from the URL
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Missing invitation token" },
        { status: 400 }
      );
    }

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("alert_invitations")
      .select("id, alert_id, group_id, status")
      .eq("token", token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { message: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    if (invitation.status === "accepted") {
      // Already accepted, just redirect to the alert
      return NextResponse.redirect(new URL(`/alerts/${invitation.alert_id}`, request.url));
    }

    // Check if user is already in the group
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", invitation.group_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!existingMember) {
      // Add user to the group
      const { error: groupError } = await supabase
        .from("group_members")
        .insert({
          group_id: invitation.group_id,
          user_id: userData.user.id,
          role: "member",
        });

      if (groupError) {
        return NextResponse.json(
          { message: "Failed to join the group" },
          { status: 500 }
        );
      }
    }

    // Update invitation status
    await supabase
      .from("alert_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    // Redirect to the alert page
    return NextResponse.redirect(new URL(`/alerts/${invitation.alert_id}`, request.url));
  } catch (error: any) {
    console.error("Error in accept-invitation API:", error);
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 