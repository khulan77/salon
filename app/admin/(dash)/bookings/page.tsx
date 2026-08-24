import Link from "next/link";
import {
  countBookingsByStatus,
  getLocations,
  getPackages,
  getServices,
  getStaff,
  searchBookings,
} from "@/app/lib/db";
import { bookingPrice, formatDate, formatPrice } from "@/app/lib/format";
import { salonToday } from "@/app/lib/time";
import { deleteBookingAction, setBookingStatusAction } from "@/app/lib/actions";
import {
  ACTION_LABELS,
  NEXT_STATUSES,
  StatusBadge,
  STATUS_LABELS,
} from "@/app/components/status-badge";
import ConfirmForm from "../confirm-form";
import NewBooking from "./new-booking";
import type { BookingStatus } from "@/app/lib/types";

export const metadata = { title: "Захиалгууд" };

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "done",
  "cancelled",
  "no_show",
];

/** Огнооны хүрээ. "Өнөөдөр" ба "Удахгүй" нь цагаар өсөхөөр эрэмбэлэгдэнэ. */
const SCOPES = [
  { key: "today", label: "Өнөөдөр" },
  { key: "upcoming", label: "Удахгүй" },
  { key: "past", label: "Өнгөрсөн" },
  { key: "all", label: "Бүгд" },
] as const;
type Scope = (typeof SCOPES)[number]["key"];

const PAGE_SIZE = 40;

/** "2026-08-17" -> "2026-08-16". Календарийн огноо тул UTC-ээр тоолно. */
function dayBefore(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    scope?: string;
    status?: string;
    q?: string;
    loc?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const scope: Scope = SCOPES.find((s) => s.key === sp.scope)?.key ?? "all";
  const status = STATUSES.find((s) => s === sp.status);
  const search = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const today = salonToday();
  const range =
    scope === "today"
      ? { from: today, to: today }
      : scope === "upcoming"
        ? { from: today }
        : scope === "past"
          ? { to: dayBefore(today) }
          : {};

  const filter = { ...range, locationId: sp.loc || undefined, search };
  const ascending = scope === "today" || scope === "upcoming";

  const [{ rows, total }, counts, services, staff, locations, packages] =
    await Promise.all([
      searchBookings({
        ...filter,
        status,
        order: ascending ? "asc" : "desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
      countBookingsByStatus(filter),
      getServices(),
      getStaff(),
      getLocations(),
      getPackages(),
    ]);

  const hasBranches = locations.length > 0;
  const scopeTotal = STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const filtered = Boolean(status || search || sp.loc || scope !== "all");
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** Одоогийн шүүлтийг хадгалж, заасан талбаруудыг сольсон холбоос. */
  const href = (next: Record<string, string | undefined>): string => {
    const merged: Record<string, string | undefined> = {
      scope: scope === "all" ? undefined : scope,
      status,
      q: search || undefined,
      loc: sp.loc || undefined,
      page: undefined, // шүүлт солигдвол эхний хуудас руу
      ...next,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Захиалгууд</h1>
          <p className="mt-1 text-muted">
            {filtered
              ? `Шүүлтэд тохирсон ${total} захиалга.`
              : `Нийт ${total} захиалга.`}
          </p>
        </div>
        <NewBooking
          services={services.filter((s) => s.active)}
          staff={staff.filter((s) => s.active)}
          locations={locations.filter((l) => l.active)}
          packages={packages.filter((p) => p.active)}
        />
      </div>

      {/* Огнооны хүрээ */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {SCOPES.map((s) => (
          <Link
            key={s.key}
            href={href({ scope: s.key === "all" ? undefined : s.key })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
              scope === s.key
                ? "bg-primary text-white"
                : "border border-border bg-surface text-foreground/80 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Төлөв */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Link
          href={href({ status: undefined })}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs transition-colors ${
            !status
              ? "bg-foreground text-background"
              : "border border-border bg-surface text-muted hover:text-foreground"
          }`}
        >
          Бүх төлөв {scopeTotal > 0 && <span className="opacity-70">({scopeTotal})</span>}
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={href({ status: s })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs transition-colors ${
              status === s
                ? "bg-foreground text-background"
                : "border border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {STATUS_LABELS[s]} <span className="opacity-70">({counts[s]})</span>
          </Link>
        ))}
      </div>

      {/* Хайлт + салбар */}
      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        {scope !== "all" && <input type="hidden" name="scope" value={scope} />}
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={search}
          placeholder="Нэр, утас эсвэл код…"
          className="w-full min-w-0 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-primary sm:w-auto sm:flex-1"
        />
        {locations.length > 1 && (
          <select
            name="loc"
            defaultValue={sp.loc ?? ""}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Бүх салбар</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name || l.address || l.id}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Хайх
        </button>
        {filtered && (
          <Link
            href="/admin/bookings"
            className="rounded-full px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Цэвэрлэх
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          {filtered
            ? "Энэ шүүлтэд тохирох захиалга алга байна."
            : "Одоогоор захиалга алга байна."}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((b) => {
            const svc = services.find((s) => s.id === b.serviceId);
            const pkg = b.packageId ? packages.find((p) => p.id === b.packageId) : undefined;
            const stf = staff.find((s) => s.id === b.staffId);
            const loc = locations.find((l) => l.id === (b.locationId ?? stf?.locationId));
            const itemLabel = pkg
              ? `${pkg.emoji} ${pkg.name} (багц)`
              : svc
                ? `${svc.emoji} ${svc.name}`
                : "—";
            const itemPrice = bookingPrice(b, services, packages);

            const details = (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-3">
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
                  {NEXT_STATUSES[b.status].map((next) => (
                    <form key={next} action={setBookingStatusAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="status" value={next} />
                      <button
                        type="submit"
                        className={`rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-colors ${
                          next === "cancelled" || next === "no_show"
                            ? "text-muted hover:border-rose-300 hover:text-rose-600"
                            : "text-foreground hover:border-primary hover:text-primary"
                        }`}
                      >
                        {b.status === "cancelled" && next === "confirmed"
                          ? "Сэргээх"
                          : ACTION_LABELS[next]}
                      </button>
                    </form>
                  ))}
                  <ConfirmForm
                    action={deleteBookingAction}
                    message={`${b.customerName} — ${formatDate(b.date)} ${b.time} захиалгыг бүрмөсөн устгах уу?`}
                    className="ml-auto"
                  >
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      className="rounded-full px-4 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Устгах
                    </button>
                  </ConfirmForm>
                </div>
              </>
            );

            return (
              <div key={b.id} className="card p-5">
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
                      {b.date === today && (
                        <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
                          Өнөөдөр
                        </span>
                      )}
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

                {/*
                  Дууссан захиалга бол ажил нь хийгдэж дууссан тул дэлгэрэнгүйг
                  нь хаагаад зөвхөн толгойг нь харуулна — жагсаалт богиносч,
                  идэвхтэй захиалгууд нүдэнд шууд тусна. `<details>` ашигласан
                  тул нэмэлт JavaScript хэрэггүй.
                */}
                {b.status === "done" ? (
                  <details className="group mt-3">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-primary [&::-webkit-details-marker]:hidden">
                      Дэлгэрэнгүй харах
                      <span
                        aria-hidden
                        className="transition-transform group-open:rotate-180"
                      >
                        ▾
                      </span>
                    </summary>
                    <div className="mt-4">{details}</div>
                  </details>
                ) : (
                  <div className="mt-4">{details}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lastPage > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={href({ page: String(page - 1) })}
              className="rounded-full border border-border px-5 py-2 text-foreground hover:border-primary hover:text-primary"
            >
              ← Өмнөх
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            {page} / {lastPage}
          </span>
          {page < lastPage ? (
            <Link
              href={href({ page: String(page + 1) })}
              className="rounded-full border border-border px-5 py-2 text-foreground hover:border-primary hover:text-primary"
            >
              Дараах →
            </Link>
          ) : (
            <span />
          )}
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
