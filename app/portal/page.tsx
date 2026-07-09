import { getSession } from "@/app/lib/auth";
import { getBookings, getServices } from "@/app/lib/db";
import { staffSetBookingStatusAction } from "@/app/lib/actions";
import { formatDate, formatDuration, formatPrice } from "@/app/lib/format";
import { StatusBadge } from "@/app/admin/(dash)/bookings/status";
import type { BookingStatus } from "@/app/lib/types";

const STAFF_ACTIONS: { status: BookingStatus; label: string }[] = [
  { status: "confirmed", label: "Батлах" },
  { status: "done", label: "Дууссан" },
  { status: "no_show", label: "Ирээгүй" },
  { status: "cancelled", label: "Цуцлах" },
];

export const metadata = { title: "Миний хуваарь — Lumière" };

function localTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function PortalPage() {
  const session = await getSession();
  // Layout guarantees a staff session, but guard for types.
  if (!session || session.role !== "staff") return null;

  const [allBookings, services] = await Promise.all([getBookings(), getServices()]);
  const mine = allBookings.filter(
    (b) => b.staffId === session.staffId && b.status !== "cancelled",
  );

  const today = localTodayISO();
  const upcoming = mine
    .filter((b) => b.date >= today && b.status !== "done")
    .sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));
  const past = mine
    .filter((b) => b.date < today || b.status === "done")
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  const serviceOf = (id: string) => services.find((s) => s.id === id);
  const todayCount = mine.filter((b) => b.date === today).length;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Сайн байна уу, {session.staffName} 👋
      </h1>
      <p className="mt-1 text-muted">Таны захиалгын хуваарь.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Өнөөдөр" value={`${todayCount} захиалга`} />
        <Stat label="Удахгүй болох" value={`${upcoming.length} захиалга`} />
        <Stat label="Нийт (дууссан)" value={`${past.length}`} />
      </div>

      <Section title="Удахгүй болох захиалгууд">
        {upcoming.length === 0 ? (
          <Empty>Одоогоор товлосон захиалга алга байна.</Empty>
        ) : (
          upcoming.map((b) => {
            const svc = serviceOf(b.serviceId);
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        {svc ? `${svc.emoji} ${svc.name}` : "Үйлчилгээ"}
                      </h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {b.customerName} ·{" "}
                      <a href={`tel:${b.customerPhone}`} className="text-primary hover:underline">
                        {b.customerPhone}
                      </a>
                    </p>
                    {b.note && <p className="mt-1 text-sm text-muted">📝 {b.note}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-foreground">{formatDate(b.date)}</div>
                    <div className="text-muted">⏰ {b.time}</div>
                    {svc && (
                      <div className="mt-1 text-xs text-muted">
                        {formatDuration(svc.durationMin)} · {formatPrice(svc.price)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {STAFF_ACTIONS.filter((a) => a.status !== b.status).map((a) => (
                    <form key={a.status} action={staffSetBookingStatusAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="status" value={a.status} />
                      <button
                        type="submit"
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                          a.status === "cancelled" || a.status === "no_show"
                            ? "border-border text-muted hover:border-rose-300 hover:text-rose-600"
                            : "border-border text-foreground hover:border-primary hover:text-primary"
                        }`}
                      >
                        {a.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </Section>

      {past.length > 0 && (
        <Section title="Өнгөрсөн / дууссан">
          {past.slice(0, 20).map((b) => {
            const svc = serviceOf(b.serviceId);
            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-3 text-sm"
              >
                <span className="text-foreground">
                  {svc ? `${svc.emoji} ${svc.name}` : "Үйлчилгээ"} · {b.customerName}
                </span>
                <span className="text-muted">
                  {formatDate(b.date)} · {b.time}
                </span>
              </div>
            );
          })}
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-border bg-surface p-6 text-center text-muted">
      {children}
    </p>
  );
}
