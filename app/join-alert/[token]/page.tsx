import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function JoinAlertPage({ params }: { params: { token: string } }) {
  if (!params.token) {
    redirect("/");
  }

  let invitation = null;
  let error = null;
  let success = false;
  let user = null;
  let alertTitle = "";

  try {
    const supabase = await createClient();
    
    // Get the current user if logged in
    const { data: userData } = await supabase.auth.getUser();
    user = userData?.user;
    
    // Get the invitation
    const { data: invitationData, error: invitationError } = await supabase
      .from("alert_invitations")
      .select("*, alert:alert_id(title)")
      .eq("token", params.token)
      .single();
    
    if (invitationError) {
      error = "Invalid or expired invitation link. Please contact the administrator.";
    } else {
      invitation = invitationData;
      alertTitle = invitation.alert?.title || "Emergency Alert";
      
      // If user is logged in, add them to the group
      if (user) {
        // Check if user is in the group already
        const { data: existingMember } = await supabase
          .from("group_members")
          .select("id")
          .eq("group_id", invitation.group_id)
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (!existingMember) {
          // Add user to the group
          const { error: groupError } = await supabase
            .from("group_members")
            .insert({
              group_id: invitation.group_id,
              user_id: user.id,
              role: "member",
            });
            
          if (groupError) {
            error = "Failed to join the group. Please try again later.";
          } else {
            // Update invitation status
            await supabase
              .from("alert_invitations")
              .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
              })
              .eq("id", invitation.id);
              
            success = true;
          }
        } else {
          success = true; // User already in group
        }
      }
    }
  } catch (e) {
    console.error("Error in JoinAlertPage:", e);
    error = "An unexpected error occurred. Please try again later.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-lg">
        <CardHeader className={success ? "bg-green-100" : error ? "bg-red-100" : "bg-blue-100"}>
          <div className="flex items-center justify-center mb-4">
            {success ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : error ? (
              <AlertTriangle className="h-12 w-12 text-red-500" />
            ) : (
              <img 
                src="/logo.png" 
                alt="Amanos Logo" 
                className="h-16 w-16 rounded-full border-2 border-black shadow-md"
              />
            )}
          </div>
          <CardTitle className="text-center text-xl">
            {success
              ? "Successfully Joined!"
              : error
              ? "Invitation Error"
              : `You're invited to join ${alertTitle}`}
          </CardTitle>
          <CardDescription className="text-center">
            {success
              ? "You now have access to this alert."
              : error
              ? error
              : invitation?.name
              ? `Hi ${invitation.name}, you've been invited to join an emergency alert group.`
              : "You've been invited to join an emergency alert group."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {!error && !success && (
            <>
              <p className="mb-4">
                This is an invitation to join a crisis alert group on Amanos. 
                By accepting this invitation, you'll:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li>Receive important notifications about this emergency</li>
                <li>Be able to communicate with other group members</li>
                <li>Access resources and assistance related to this crisis</li>
              </ul>
              {!user && (
                <p className="text-sm text-gray-600 mb-2">
                  To proceed, you'll need to sign in or create an account.
                </p>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 p-6 pt-0">
          {success ? (
            <Button asChild className="w-full bg-green-500 hover:bg-green-600">
              <Link href={`/alerts/${invitation.alert_id}`}>
                View Alert Details
              </Link>
            </Button>
          ) : error ? (
            <Button asChild className="w-full">
              <Link href="/">
                Return to Homepage
              </Link>
            </Button>
          ) : user ? (
            <form action={`/api/alerts/accept-invitation?token=${params.token}`} method="POST" className="w-full">
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
                Accept Invitation
              </Button>
            </form>
          ) : (
            <>
              <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
                <Link href={`/sign-in?redirect=/join-alert/${params.token}`}>
                  Sign In to Accept
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/sign-up?redirect=/join-alert/${params.token}`}>
                  Create New Account
                </Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 