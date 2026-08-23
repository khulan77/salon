import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/app/lib/auth";
import { logoutAction } from "@/app/lib/actions";
import { getSettings } from "@/app/lib/db";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin"); 

  const { salonName } = await getSettings();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-3 px-4 sm:px-5">
          <Link href="/portal" className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate font-display text-xl font-semibold text-foreground sm:text-2xl">
              {salonName}
            </span>
            <span className="shrink-0 text-xs text-muted">Ажилтан</span>
          </Link>
          <div className="flex shrink-0 items-center gap-4">
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
      <main className="flex-1 px-4 py-8 sm:px-5">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
