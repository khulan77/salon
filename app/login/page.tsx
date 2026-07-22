import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/app/lib/auth";
import { isSupabaseConfigured } from "@/app/lib/supabase/config";
import { getSettings } from "@/app/lib/db";
import LoginForm from "./login-form";

export const metadata = { title: "Нэвтрэх" };

export default async function LoginPage() {
  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "staff") redirect("/portal");

  const configured = isSupabaseConfigured();
  const { salonName } = await getSettings();

  return (
    <div className="bg-warm flex min-h-screen flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-1.5">
          <span className="font-display text-3xl font-semibold text-foreground">{salonName}</span>
          <span className="text-primary">✦</span>
        </Link>
        <p className="mt-2 text-center text-sm text-muted">Ажилтны нэвтрэх хэсэг</p>

        <div className="mt-8 rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="font-display text-xl font-semibold text-foreground">Нэвтрэх</h1>
          <p className="mt-1 text-sm text-muted">Имэйл болон нууц үгээ оруулна уу.</p>

          {!configured && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              ⚠️ Supabase тохируулаагүй байна. <code>.env.local</code> дотор{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code>-ээ оруулна уу.
            </p>
          )}

          <LoginForm />
        </div>

        <Link href="/" className="mt-6 block text-center text-sm text-muted hover:text-primary">
          ← Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
