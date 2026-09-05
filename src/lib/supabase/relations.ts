/**
 * Supabase's TypeScript inference types to-one relationships as arrays,
 * but PostgREST returns a single object (or null) at runtime for FK
 * relationships. This helper normalizes the value so callers can access
 * fields directly without resorting to `any`.
 *
 * Example:
 *   const profile = single<{ first_name: string | null }>(booking.profiles);
 *   profile?.first_name
 */
export function single<T>(value: T[] | T | null | undefined): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T) ?? null;
  }
  return (value as T) ?? null;
}