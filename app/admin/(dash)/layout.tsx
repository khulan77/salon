import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { countPendingBookings, getSettings } from "@/app/lib/db";
import AdminSidebar from "./admin-sidebar";

export default async function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "staff") redirect("/portal"); // staff can't access admin

  const [pendingCount, settings] = await Promise.all([
    countPendingBookings(),
    getSettings(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-screen lg:flex-row lg:overflow-hidden">
      <AdminSidebar pendingCount={pendingCount} salonName={settings.salonName} />
      {/* `min-w-0` — өргөн хүснэгт/хуанли main-ийг сунгалгүй, өөрөө хажуу тийш гүйлгэнэ. */}
      <main className="min-w-0 flex-1 px-0 py-3 sm:px-5 sm:py-4 lg:h-screen lg:overflow-y-auto lg:px-7 lg:py-4">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
