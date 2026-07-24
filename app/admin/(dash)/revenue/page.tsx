import { getBookings, getPackages, getServices, getStaff } from "@/app/lib/db";
import { effectivePrice, formatPrice } from "@/app/lib/format";
import { salonToday } from "@/app/lib/time";
import type { Booking } from "@/app/lib/types";

export const metadata = { title: "Орлого" };

const MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

export default async function AdminRevenuePage() {
  const [bookings, services, staff, packages] = await Promise.all([
    getBookings(),
    getServices(),
    getStaff(),
    getPackages(),
  ]);

  // Орлогыг хямдрал тооцсон бодит үнээр бодно. Багц захиалга бол багцын үнэ.
  const priceOf = (b: Booking) => {
    if (b.packageId) return packages.find((p) => p.id === b.packageId)?.price ?? 0;
    const svc = services.find((s) => s.id === b.serviceId);
    return svc ? effectivePrice(svc) : 0;
  };

  const done = bookings.filter((b) => b.status === "done");
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  const realized = done.reduce((sum, b) => sum + priceOf(b), 0);
  const expected = confirmed.reduce((sum, b) => sum + priceOf(b), 0);

  // Сарын зааг ч салоны цагаар — UTC сервер дээр сарын эхний өдөр
  // өмнөх сар руу орох эрсдэлгүй.
  const salonMonth = salonToday().slice(0, 7);
  const monthIndex = Number(salonMonth.slice(5, 7)) - 1;
  const thisMonth = done
    .filter((b) => b.date.startsWith(salonMonth))
    .reduce((sum, b) => sum + priceOf(b), 0);

  // Breakdown by service (realized).
  const byService = services
    .map((s) => {
      const rows = done.filter((b) => b.serviceId === s.id);
      return {
        name: s.name,
        emoji: s.emoji,
        count: rows.length,
        revenue: rows.length * effectivePrice(s),
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // Breakdown by staff (realized).
  const byStaff = staff
    .map((m) => {
      const rows = done.filter((b) => b.staffId === m.id);
      return {
        name: m.name,
        emoji: m.emoji,
        image: m.imageUrl,
        count: rows.length,
        revenue: rows.reduce((sum, b) => sum + priceOf(b), 0),
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // Monthly trend (realized), last 6 months present in data.
  const monthMap = new Map<string, number>();
  for (const b of done) {
    const key = b.date.slice(0, 7);
    monthMap.set(key, (monthMap.get(key) ?? 0) + priceOf(b));
  }
  const months = Array.from(monthMap.entries()).sort().slice(-6);
  const maxMonth = Math.max(1, ...months.map(([, v]) => v));

  const cards = [
    { label: "Нийт биелсэн орлого", value: realized, hint: `${done.length} үйлчилгээ`, accent: true },
    { label: "Энэ сарын орлого", value: thisMonth, hint: MONTHS[monthIndex] },
    { label: "Хүлээгдэж буй (батлагдсан)", value: expected, hint: `${confirmed.length} захиалга` },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">Орлого</h1>
      <p className="mt-1 text-muted">
        Орлогыг <b>дууссан</b> үйлчилгээгээр тооцно. Батлагдсан захиалга нь хүлээгдэж
        буй орлого.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-6 ${
              c.accent
                ? "border-transparent bg-gradient-to-br from-primary to-primary-hover text-white"
                : "border-border bg-surface"
            }`}
          >
            <div className={`text-sm ${c.accent ? "text-white/80" : "text-muted"}`}>
              {c.label}
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">
              {formatPrice(c.value)}
            </div>
            <div className={`mt-1 text-xs ${c.accent ? "text-white/70" : "text-muted"}`}>
              {c.hint}
            </div>
          </div>
        ))}
      </div>

      {months.length > 0 && (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Сарын орлого</h2>
          <div className="mt-6 flex items-end gap-4">
            {months.map(([key, value]) => {
              const [, m] = key.split("-");
              return (
                <div key={key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {formatPrice(value)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-primary/80"
                    style={{ height: `${Math.max(6, (value / maxMonth) * 140)}px` }}
                  />
                  <span className="text-xs text-muted">{MONTHS[Number(m) - 1]}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BreakdownTable
          title="Үйлчилгээгээр"
          rows={byService.map((r) => ({
            label: `${r.emoji} ${r.name}`,
            count: r.count,
            revenue: r.revenue,
          }))}
          total={realized}
        />
        <BreakdownTable
          title="Мастераар"
          rows={byStaff.map((r) => ({
            label: `${r.emoji} ${r.name}`,
            count: r.count,
            revenue: r.revenue,
          }))}
          total={realized}
        />
      </div>

      {done.length === 0 && (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          Одоогоор дууссан үйлчилгээ алга байна. Захиалгыг &ldquo;Дуусгах&rdquo; болгосны дараа
          орлого энд харагдана.
        </p>
      )}
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; count: number; revenue: number }[];
  total: number;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Мэдээлэл алга.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{r.label}</span>
                <span className="font-medium text-foreground">{formatPrice(r.revenue)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${total ? (r.revenue / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-muted">
                  {r.count} удаа
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
