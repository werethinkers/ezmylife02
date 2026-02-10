import { supabase } from "@/integrations/supabase/client";

type ActionType = "tool_usage" | "profile_edit" | "login" | "signup" | "payment" | "subscription";

interface LogDetails {
  [key: string]: unknown;
}

export const logActivity = async (
  actionType: ActionType,
  details: LogDetails = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("activity_logs").insert([{
      user_id: user.id,
      action_type: actionType,
      action_details: JSON.parse(JSON.stringify(details)),
    }]);
  } catch (error) {
    // Silently fail - logging should never break the app
    console.error("Activity log error:", error);
  }
};
