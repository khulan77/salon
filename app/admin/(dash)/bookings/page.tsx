import { getBookings, getServices, getStaff } from "@/app/lib/db";
import { formatDate, formatPrice } from "@/app/lib/format";
import { deleteBookingAction, setBookingStatusAction } from "@/app/lib/actions";
import { StatusBadge } from "./status";
import type { BookingStatus } from "@/app/lib/types";

export const metadata = { title: "Захиалгууд — Lumière Admin" };

const ACTIONS: { status: BookingStatus; label: string }[] = [
  { status: "confirmed", label: "Батлах" },
  { status: "done", label: "Дуусгах" },
  { status: "cancelled", label: "Цуцлах" },
];

export default async function AdminBookingsPage() {
  const [bookings, services, staff] = await Promise.all([
    getBookings(),
    getServices(),
    getStaff(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">Захиалгууд</h1>
      <p className="mt-1 text-muted">Нийт {bookings.length} захиалга.</p>

      {bookings.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          Одоогоор захиалга алга байна.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((b) => {
            const svc = services.find((s) => s.id === b.serviceId);
            const stf = staff.find((s) => s.id === b.staffId);
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{b.customerName}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <a
                      href={`tel:${b.customerPhone}`}
                      className="mt-0.5 block text-sm text-primary hover:underline"
                    >
                      📞 {b.customerPhone}
                    </a>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-foreground">
                      {formatDate(b.date)}
                    </div>
                    <div className="text-muted">⏰ {b.time}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                  <Info label="Үйлчилгээ" value={svc ? `${svc.emoji} ${svc.name}` : "—"} />
                  <Info label="Мастер" value={stf ? `${stf.emoji} ${stf.name}` : "—"} />
                  <Info label="Төлбөр" value={svc ? formatPrice(svc.price) : "—"} />
                </div>

                {b.note && (
                  <p className="mt-3 rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-muted">
                    📝 {b.note}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  {ACTIONS.filter((a) => a.status !== b.status).map((a) => (
                    <form key={a.status} action={setBookingStatusAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="status" value={a.status} />
                      <button
                        type="submit"
                        className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {a.label}
                      </button>
                    </form>
                  ))}
                  <form action={deleteBookingAction} className="ml-auto">
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      className="rounded-full px-4 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Устгах
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  );
}
