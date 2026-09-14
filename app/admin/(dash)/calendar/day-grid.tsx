import Link from "next/link";
import type { Booking, Staff } from "@/app/lib/types";
import { formatPrice } from "@/app/lib/format";

/*
  Өдрийн хуанли — мастер бүр нэг багана, цаг доошоо урсана.

  Хэвтээ шугам, блокуудыг пиксельээр байрлуулна: нэг минут = `PX_PER_MIN`
  пиксел. Ингэснээр 45 минутын үйлчилгээ 45 минутын өндөртэй яг харагдана —
  зөвхөн жагсаалт байхад ойлгогддоггүй "хэн хэзээ завтай вэ" гэдэг нь нэг
  харцаар мэдэгдэнэ.
*/

export const PX_PER_MIN = 1.4;

export type CalBooking = {
  booking: Booking;
  startMin: number;
  durationMin: number;
  itemLabel: string;
  /** Үйлчилгээ/багцын үнэ дээр нэмэлт төлбөрийг нэмсэн дүн. */
  price: number;
  /** Төлөгдсөн (урьдчилгаа) дүн. */
  paid: number;
};

export type Column = {
  staff: Staff;
  bookings: CalBooking[];
};

/**
 * Блокны өнгө төлөвөөр. Зүүн талын нарийн зурвас нь тод, дэвсгэр нь зөөлөн —
 * олон блок зэрэг харагдахад нүд ядрахгүй, гэхдээ төлөв нь шууд ялгарна.
 */
const STATUS_STYLES: Record<string, { block: string; bar: string }> = {
  pending: { block: "bg-amber-50 text-amber-900", bar: "bg-amber-400" },
  confirmed: { block: "bg-primary-soft text-foreground", bar: "bg-primary" },
  done: { block: "bg-emerald-50 text-emerald-900", bar: "bg-emerald-500" },
  no_show: { block: "bg-zinc-100 text-zinc-600", bar: "bg-zinc-400" },
  cancelled: { block: "bg-surface-2 text-muted", bar: "bg-border" },
};

/** "10:00" -> 600 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function label(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (first + second).toUpperCase();
}

export default function DayGrid({
  columns,
  cancelled,
  openMin,
  closeMin,
  stepMin,
  nowMin,
}: {
  columns: Column[];
  /** Тухайн өдрийн цуцлагдсан захиалгууд — торыг бөглөхгүй, доор түүх болно. */
  cancelled: CalBooking[];
  openMin: number;
  closeMin: number;
  /** Хэвтээ шугамын алхам — ихэвчлэн 30 минут. */
  stepMin: number;
  /** Улаан "яг одоо" шугам. Өнөөдрийг харж байгаа үед л дамжуулна. */
  nowMin?: number;
}) {
  const totalMin = Math.max(60, closeMin - openMin);
  const height = totalMin * PX_PER_MIN;
  const lines = Math.ceil(totalMin / stepMin);

  const all = columns.flatMap((c) => c.bookings);
  const dayTotal = all.reduce((sum, b) => sum + b.price, 0);
  const dayPaid = all.reduce((sum, b) => sum + Math.min(b.paid, b.price), 0);

  return (
    <div>
      {cancelled.length > 0 && (
        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted [&::-webkit-details-marker]:hidden">
            <span className="transition-transform group-open:rotate-90">›</span>
            Цуцлагдсан түүх
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-foreground">
              {cancelled.length}
            </span>
          </summary>
          <ul className="mt-2 space-y-1.5">
            {cancelled.map((b) => (
              <li key={b.booking.id}>
                <Link
                  href={`/admin/bookings?q=${b.booking.code}`}
                  className="flex items-center gap-3 rounded-xl bg-surface-2/50 px-3 py-2 text-xs text-muted transition-colors hover:text-foreground"
                >
                  <span className="tabular-nums">{label(b.startMin)}</span>
                  <span className="truncate font-medium text-foreground/70 line-through">
                    {b.booking.customerName}
                  </span>
                  <span className="truncate">{b.itemLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="no-scrollbar mt-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Мастеруудын толгой — доош гүйлгэхэд наалдаж үлдэнэ. */}
          <div className="sticky top-0 z-30 flex bg-background/95 backdrop-blur">
            <div className="sticky left-0 z-10 w-14 shrink-0 bg-background/95 sm:w-16" />
            {columns.map((c) => {
              const total = c.bookings.reduce((sum, b) => sum + b.price, 0);
              return (
                <div
                  key={c.staff.id}
                  className="w-[11rem] shrink-0 border-l border-border/60 px-3 py-3 sm:w-[13rem]"
                >
                  <div className="flex items-center gap-2">
                    {c.staff.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.staff.imageUrl}
                        alt={c.staff.name}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                        {initials(c.staff.name)}
                      </span>
                    )}
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.staff.name}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted">
                    {c.bookings.length} захиалга
                    {total > 0 && (
                      <>
                        {" · "}
                        <b className="font-semibold text-foreground">
                          {formatPrice(total)}
                        </b>
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          {/* `relative` — "яг одоо" шугам энэ хайрцгийг дагаж байрлана. */}
          <div className="relative flex">
            {/* Хажуу тийш гүйлгэхэд цагийн багана байрандаа үлдэнэ — эс тэгвэл
                утсан дээр баруун тийш гүйлгэхэд аль цаг болох нь мэдэгдэхгүй. */}
            <div
              className="sticky left-0 z-10 w-14 shrink-0 bg-background/95 sm:w-16"
              style={{ height }}
            >
              {Array.from({ length: lines + 1 }, (_, i) => {
                const min = openMin + i * stepMin;
                const onHour = min % 60 === 0;
                return (
                  <span
                    key={min}
                    style={{ top: (min - openMin) * PX_PER_MIN }}
                    className={`absolute right-2 -translate-y-1/2 tabular-nums ${
                      onHour ? "text-xs text-muted" : "text-[10px] text-muted/50"
                    }`}
                  >
                    {label(min)}
                  </span>
                );
              })}

              {/* Одоогийн цагийн шошго */}
              {nowMin !== undefined && nowMin >= openMin && nowMin <= closeMin && (
                <span
                  style={{ top: (nowMin - openMin) * PX_PER_MIN }}
                  className="absolute right-1 z-20 -translate-y-1/2 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white"
                >
                  {label(nowMin)}
                </span>
              )}
            </div>

            {columns.map((c) => (
              <div
                key={c.staff.id}
                className="relative w-[11rem] shrink-0 border-l border-border/60 sm:w-[13rem]"
                style={{ height }}
              >
                {/* Хэвтээ шугамууд */}
                {Array.from({ length: lines }, (_, i) => (
                  <span
                    key={i}
                    style={{ top: i * stepMin * PX_PER_MIN }}
                    className={`absolute inset-x-0 border-t ${
                      (openMin + i * stepMin) % 60 === 0
                        ? "border-border/70"
                        : "border-border/35"
                    }`}
                  />
                ))}

                {c.bookings.map((b) => {
                  const top = (b.startMin - openMin) * PX_PER_MIN;
                  const blockHeight = Math.max(b.durationMin * PX_PER_MIN, 30);
                  const style =
                    STATUS_STYLES[b.booking.status] ?? STATUS_STYLES.confirmed;
                  const endMin = b.startMin + b.durationMin;
                  return (
                    <Link
                      key={b.booking.id}
                      href={`/admin/bookings?q=${b.booking.code}`}
                      style={{ top, height: blockHeight }}
                      title={`${b.booking.customerName} · ${label(b.startMin)}–${label(endMin)} · ${b.itemLabel} · ${formatPrice(b.price)}`}
                      className={`absolute inset-x-1 flex flex-col overflow-hidden rounded-lg pl-3 pr-2 py-1.5 text-left shadow-[0_1px_2px_rgba(46,39,35,0.06)] transition-transform hover:z-10 hover:scale-[1.02] ${style.block}`}
                    >
                      {/* Зүүн талын өнгөт зурвас — төлөвийг нэг харцаар. */}
                      <span
                        className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${style.bar}`}
                      />
                      <span className="block truncate text-[10px] tabular-nums opacity-70">
                        {label(b.startMin)}–{label(endMin)}
                      </span>
                      <span className="block truncate text-[13px] font-semibold">
                        {b.booking.customerName}
                      </span>
                      {blockHeight >= 62 && (
                        <span className="block truncate text-[11px] opacity-75">
                          {b.itemLabel}
                        </span>
                      )}
                      {blockHeight >= 46 && b.price > 0 && (
                        <span className="mt-auto block truncate text-right text-[11px] font-semibold tabular-nums">
                          {formatPrice(b.price)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* "Яг одоо" шугам — бүх баганыг дамнана. */}
            {nowMin !== undefined && nowMin >= openMin && nowMin <= closeMin && (
              <span
                style={{ top: (nowMin - openMin) * PX_PER_MIN }}
                className="pointer-events-none absolute left-14 right-0 z-20 h-px bg-rose-500 sm:left-16"
              />
            )}
          </div>
        </div>
      </div>

      {/* Өдрийн мөнгөн дүн — Fresha-гийн адил доод мөрөнд. */}
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border/60 pt-3 text-sm">
        <span className="text-muted">
          Өдрийн нийт{" "}
          <b className="font-display text-lg font-semibold text-foreground">
            {formatPrice(dayTotal)}
          </b>
        </span>
        <span className="flex gap-5 text-muted">
          <span>
            Төлөгдсөн <b className="text-emerald-700">{formatPrice(dayPaid)}</b>
          </span>
          <span>
            Үлдэгдэл{" "}
            <b className="text-foreground">{formatPrice(Math.max(0, dayTotal - dayPaid))}</b>
          </span>
        </span>
      </div>
    </div>
  );
}
