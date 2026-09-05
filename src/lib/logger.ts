import { createAdminClient } from "@/lib/supabase/admin";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

type LogInput = {
  level?: LogLevel;
  service?: string;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
};

/**
 * Structured application logger.
 *
 * Writes to the `logs` table via the service-role client (bypasses RLS).
 * Logging is best-effort: failures are swallowed so logging never breaks the
 * primary request flow. Also mirrors to console for local debugging.
 */
export async function log(input: LogInput) {
  const level = input.level ?? "INFO";

  // Mirror to console for local development.
  const consoleFn =
    level === "ERROR" || level === "FATAL"
      ? console.error
      : level === "WARN"
        ? console.warn
        : console.log;
  consoleFn(`[${level}] ${input.message}`, input.context ?? {});

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("logs").insert({
      level,
      service: input.service ?? "web",
      message: input.message,
      context: input.context ?? {},
      trace_id: input.traceId ?? null,
    });

    if (error) {
      console.error("log insert failed:", error.message);
    }
  } catch (err) {
    console.error("log threw:", err);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log({ level: "DEBUG", message, context }),
  info: (message: string, context?: Record<string, unknown>) =>
    log({ level: "INFO", message, context }),
  warn: (message: string, context?: Record<string, unknown>) =>
    log({ level: "WARN", message, context }),
  error: (message: string, context?: Record<string, unknown>) =>
    log({ level: "ERROR", message, context }),
  fatal: (message: string, context?: Record<string, unknown>) =>
    log({ level: "FATAL", message, context }),
};