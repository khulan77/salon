import { getBookings, getLocations, getPackages, getServices, getStaff } from "@/app/lib/db";
import { effectivePrice, formatDate, formatPrice } from "@/app/lib/format";
import { deleteBookingAction, setBookingStatusAction } from "@/app/lib/actions";
import { StatusBadge } from "@/app/components/status-badge";
import type { BookingStatus } from "@/app/lib/types";

export const metadata = { title: "Захиалгууд" };

const ACTIONS: { status: BookingStatus; label: string }[] = [
  { status: "confirmed", label: "Батлах" },
  { status: "done", label: "Дуусгах" },
  { status: "cancelled", label: "Цуцлах" },
];

export default async function AdminBookingsPage() {
  const [bookings, services, staff, locations, packages] = await Promise.all([
    getBookings(),
    getServices(),
    getStaff(),
    getLocations(),
    getPackages(),
  ]);
  const hasBranches = locations.length > 0;

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
            const pkg = b.packageId ? packages.find((p) => p.id === b.packageId) : undefined;
            const stf = staff.find((s) => s.id === b.staffId);
            const locId = b.locationId ?? stf?.locationId;
            const loc = locations.find((l) => l.id === locId);
            const itemLabel = pkg
              ? `${pkg.emoji} ${pkg.name} (багц)`
              : svc
                ? `${svc.emoji} ${svc.name}`
                : "—";
            const itemPrice = pkg ? pkg.price : svc ? effectivePrice(svc) : 0;
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
                    {b.code && (
                      <div
                        className="mt-1 font-mono text-xs tracking-[0.15em] text-muted"
                        title="Үйлчлүүлэгчид өгсөн захиалгын код"
                      >
                        {b.code}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                  <Info label={pkg ? "Багц" : "Үйлчилгээ"} value={itemLabel} />
                  <Info label="Мастер" value={stf ? `${stf.emoji} ${stf.name}` : "—"} />
                  <Info label="Төлбөр" value={itemPrice ? formatPrice(itemPrice) : "—"} />
                  {hasBranches && (
                    <Info label="Салбар" value={loc ? `🏢 ${loc.name || loc.address}` : "—"} />
                  )}
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
