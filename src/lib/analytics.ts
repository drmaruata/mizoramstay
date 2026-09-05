import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Track a product/analytics event server-side.
 *
 * Uses the service-role client so events can be recorded regardless of the
 * caller's RLS visibility. Call from Server Actions, Route Handlers, or
 * Server Components. For client-side tracking, prefer the /api/v1/analytics
 * endpoint which validates input and rate-limits.
 */
export async function trackEvent(input: {
  eventName: string;
  userId?: string | null;
  sessionId?: string | null;
  properties?: Record<string, unknown>;
  pagePath?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_name: input.eventName,
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      properties: input.properties ?? {},
      page_path: input.pagePath ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });

    if (error) {
      console.error("trackEvent failed:", error.message);
    }
  } catch (err) {
    // Analytics must never break the primary request flow.
    console.error("trackEvent threw:", err);
  }
}