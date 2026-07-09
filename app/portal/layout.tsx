import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/app/lib/auth";
import { logoutAction } from "@/app/lib/actions";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin"); // admins use the full panel

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5">
          <Link href="/portal" className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold text-foreground">Lumière</span>
            <span className="text-xs text-muted">Ажилтан</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:block">
              👋 {session.staffName}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-ring"
              >
                Гарах
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 px-5 py-8">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
