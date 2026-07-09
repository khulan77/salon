import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { countPendingBookings } from "@/app/lib/db";
import AdminSidebar from "./admin-sidebar";

export default async function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "staff") redirect("/portal"); // staff can't access admin

  const pendingCount = await countPendingBookings();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
