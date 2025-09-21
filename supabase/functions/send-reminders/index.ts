import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface StudyBlock {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  reminder_sent: boolean;
}

interface Profile {
  email: string;
  full_name: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email reminder check...");

    // Get current time and 10 minutes from now
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    console.log("Checking for study blocks starting between:", now.toISOString(), "and", tenMinutesFromNow.toISOString());

    // Find study blocks that start in the next 10 minutes and haven't had reminders sent
    const { data: studyBlocks, error: blocksError } = await supabase
      .from("study_blocks")
      .select("*")
      .gte("start_time", now.toISOString())
      .lt("start_time", tenMinutesFromNow.toISOString())
      .eq("reminder_sent", false);

    if (blocksError) {
      console.error("Error fetching study blocks:", blocksError);
      throw blocksError;
    }

    console.log(`Found ${studyBlocks?.length || 0} study blocks needing reminders`);

    if (!studyBlocks || studyBlocks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process each study block
    for (const block of studyBlocks as StudyBlock[]) {
      try {
        console.log(`Processing study block: ${block.title} for user: ${block.user_id}`);

        // Get user profile for email
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", block.user_id)
          .single();

        if (profileError || !profile) {
          console.error(`Error getting profile for user ${block.user_id}:`, profileError);
          continue;
        }

        const userProfile = profile as Profile;
        const startTime = new Date(block.start_time);
        const endTime = new Date(block.end_time);

        // Format the time nicely
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC'
        });

        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC'
        });

        const startTimeStr = timeFormatter.format(startTime);
        const endTimeStr = timeFormatter.format(endTime);
        const dateStr = dateFormatter.format(startTime);

        // Send email reminder
        const emailResponse = await resend.emails.send({
          from: "Quiet Hours Scheduler <onboarding@resend.dev>",
          to: [userProfile.email],
          subject: `📚 Your study session "${block.title}" starts in 10 minutes!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a365d; margin-bottom: 20px;">🔔 Study Session Reminder</h1>
              
              <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2d3748; margin-top: 0;">${block.title}</h2>
                ${block.description ? `<p style="color: #4a5568; margin-bottom: 15px;">${block.description}</p>` : ''}
                
                <div style="color: #4a5568;">
                  <p><strong>📅 Date:</strong> ${dateStr}</p>
                  <p><strong>⏰ Time:</strong> ${startTimeStr} - ${endTimeStr}</p>
                  <p><strong>⏱️ Duration:</strong> ${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} minutes</p>
                </div>
              </div>

              <div style="background: #e6fffa; border-radius: 8px; padding: 20px; border-left: 4px solid #38b2ac;">
                <p style="margin: 0; color: #234e52;">
                  <strong>Your quiet study session starts in 10 minutes!</strong><br>
                  Get ready to focus and make the most of your dedicated study time.
                </p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
                <p>Happy studying! 📖</p>
                <p>- Quiet Hours Scheduler</p>
              </div>
            </div>
          `,
        });

        console.log("Email sent successfully:", emailResponse);

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("study_blocks")
          .update({ reminder_sent: true })
          .eq("id", block.id);

        if (updateError) {
          console.error(`Error updating reminder status for block ${block.id}:`, updateError);
        } else {
          console.log(`Successfully sent reminder for study block: ${block.title}`);
        }

      } catch (error) {
        console.error(`Error processing study block ${block.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Email reminders processed successfully",
        processed: studyBlocks.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in send-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);