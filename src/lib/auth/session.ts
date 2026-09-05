import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/marketplace";

export type AuthUser = {
  id: string;
  email: string | undefined;
  role: UserRole;
};

/**
 * Returns the currently authenticated user, or null if not signed in.
 * Uses `getUser()` (not `getSession()`) which verifies the JWT with the
 * auth server — this is the recommended, more secure approach.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch the profile to get the role. The profile row is created by the
  // handle_new_user trigger on signup.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? undefined,
    role: (profile?.role as UserRole) ?? "TOURIST",
  };
}

/**
 * Requires an authenticated user, otherwise redirects to /login.
 * Returns the authenticated user.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Requires an authenticated user with one of the allowed roles.
 * Redirects to /login if unauthenticated, or /forbidden if the role
 * is not permitted.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/forbidden");
  }
  return user;
}

/** Convenience guards for common role groups. */
export const requireHost = () => requireRole(["HOST", "ADMIN", "SUPER_ADMIN"]);
export const requireAdmin = () => requireRole(["ADMIN", "SUPER_ADMIN"]);
