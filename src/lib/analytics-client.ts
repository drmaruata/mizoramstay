"use client";

/**
 * Client-side analytics tracking helper.
 *
 * Sends events to the /api/v1/analytics endpoint which validates input,
 * attaches the authenticated user id, and records into analytics_events.
 * Failures are swallowed so tracking never breaks the primary flow.
 */
export async function trackClientEvent(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch("/api/v1/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        properties: properties ?? {},
        pagePath: typeof window !== "undefined" ? window.location.pathname : null,
      }),
    });
  } catch (err) {
    // Analytics must never break the primary request flow.
    console.error("trackClientEvent failed:", err);
  }
}
