import Link from "next/link";
import { getBookings, getServices, getStaff } from "@/app/lib/db";
import { formatDate, formatPrice } from "@/app/lib/format";
import { StatusBadge } from "./bookings/status";

export const metadata = { title: "Хянах самбар — Lumière Admin" };

export default async function AdminDashboard() {
  const [services, staff, bookings] = await Promise.all([
    getServices(),
    getStaff(),
    getBookings(),
  ]);

  const pending = bookings.filter((b) => b.status === "pending").length;
  const revenue = bookings
    .filter((b) => b.status === "done" || b.status === "confirmed")
    .reduce((sum, b) => {
      const svc = services.find((s) => s.id === b.serviceId);
      return sum + (svc?.price ?? 0);
    }, 0);

  const stats = [
    { label: "Нийт захиалга", value: bookings.length, icon: "🗓️", href: "/admin/bookings" },
    { label: "Хүлээгдэж буй", value: pending, icon: "⏳", href: "/admin/bookings" },
    { label: "Үйлчилгээ", value: services.length, icon: "✨", href: "/admin/services" },
    { label: "Мастерууд", value: staff.length, icon: "💇‍♀️", href: "/admin/staff" },
  ];

  const recent = bookings.slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">Хянах самбар</h1>
      <p className="mt-1 text-muted">Салоны үйл ажиллагааны ерөнхий байдал.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-ring"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <div className="mt-3 font-display text-3xl font-semibold text-foreground">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-surface p-6">
        <div className="text-sm text-muted">Тооцоолсон орлого (баталгаажсан + дууссан)</div>
        <div className="mt-1 font-display text-3xl font-semibold text-foreground">
          {formatPrice(revenue)}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Сүүлийн захиалга</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-primary hover:underline">
            Бүгд →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
            Одоогоор захиалга алга байна.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Үйлчлүүлэгч</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Үйлчилгээ</th>
                  <th className="px-5 py-3 font-medium">Огноо</th>
                  <th className="px-5 py-3 font-medium">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((b) => {
                  const svc = services.find((s) => s.id === b.serviceId);
                  return (
                    <tr key={b.id} className="border-t border-border">
                      <td className="px-5 py-3 font-medium text-foreground">{b.customerName}</td>
                      <td className="hidden px-5 py-3 text-muted sm:table-cell">
                        {svc?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {formatDate(b.date)} · {b.time}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
