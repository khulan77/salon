import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";

export function isAdminApiConfigured(): boolean {
  return Boolean(SUPABASE_URL && SECRET);
}

/** Privileged client (secret key). Server-only — never import in client code. */
export function supabaseAdmin() {
  return createClient(SUPABASE_URL, SECRET, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Creates (or updates the password of) a Supabase Auth user for a staff email.
 * Used by the admin to give staff members login access.
 */
export async function upsertStaffAuthUser(
  email: string,
  password: string,
): Promise<void> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  const existing = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (existing) {
    const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
      password,
    });
    if (updErr) throw updErr;
  } else {
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "staff" },
    });
    if (createErr) throw createErr;
  }
}
