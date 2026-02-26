import { supabase } from "./supabase";
import type { Json } from "./supabase-types";

/**
 * Fire-and-forget event tracking. Logs events to the `events` table.
 * Never throws — silently logs errors to avoid disrupting API responses.
 */
export function trackEvent(
  userId: string | null,
  eventType: string,
  metadata?: Record<string, Json | undefined>,
): void {
  supabase
    .from("events")
    .insert({
      user_id: userId,
      event_type: eventType,
      metadata: (metadata ?? {}) as Json,
    })
    .then(({ error }) => {
      if (error) console.error(`[tracking] Failed to log event "${eventType}":`, error.message);
    });
}
