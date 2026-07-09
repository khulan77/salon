import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { getStaffByEmail } from "./db";

export type Session =
  | { role: "admin"; email: string }
  | { role: "staff"; email: string; staffId: string; staffName: string }
  | null;

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** The signed-in user's email, or null if not authenticated / not configured. */
async function currentEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/**
 * Resolves the current session into a role:
 *  - admin  → email listed in ADMIN_EMAILS
 *  - staff  → email matches a staff member's record
 *  - null   → not signed in, or signed in with no assigned role
 */
export async function getSession(): Promise<Session> {
  const email = await currentEmail();
  if (!email) return null;

  if (adminEmails().includes(email.toLowerCase())) {
    return { role: "admin", email };
  }

  const staff = await getStaffByEmail(email);
  if (staff) {
    return { role: "staff", email, staffId: staff.id, staffName: staff.name };
  }

  return null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getSession())?.role === "admin";
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}
