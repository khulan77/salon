import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";

// Service-role client for all server-side data access. Bypasses RLS.
// NEVER import this into a Client Component — the secret key must stay on the server.
export function supabaseService() {
  if (!SUPABASE_URL || !SECRET) {
    throw new Error(
      "Supabase тохируулаагүй байна: NEXT_PUBLIC_SUPABASE_URL болон SUPABASE_SECRET_KEY шаардлагатай.",
    );
  }
  return createClient(SUPABASE_URL, SECRET, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const UPLOAD_BUCKET = "uploads";
