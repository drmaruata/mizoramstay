import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validationError, internalError } from "@/lib/api-errors";

const trackEventSchema = z.object({
  eventName: z.string().min(1).max(100),
  sessionId: z.string().max(100).optional().nullable(),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  pagePath: z.string().max(500).optional().nullable(),
});

/**
 * POST /api/v1/analytics
 *
 * Client-side event tracking. Validates input, attaches the authenticated
 * user id when available, and inserts into analytics_events.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError("Request body must be valid JSON");
  }

  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(
      "Invalid analytics event",
      parsed.error.flatten().fieldErrors
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("analytics_events").insert({
    event_name: parsed.data.eventName,
    user_id: user?.id ?? null,
    session_id: parsed.data.sessionId ?? null,
    properties: parsed.data.properties,
    page_path: parsed.data.pagePath ?? null,
    ip_address: request.headers.get("x-forwarded-for") ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  if (error) {
    return internalError("Failed to record event");
  }

  return NextResponse.json({ ok: true });
}