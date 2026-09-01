import Link from "next/link";
import type { Booking, Staff } from "@/app/lib/types";

/*
  Өдрийн хуанли — мастер бүр нэг багана, цаг доошоо урсана.

  Хэвтээ шугам, блокуудыг пиксельээр байрлуулна: нэг минут = `PX_PER_MIN`
  пиксел. Ингэснээр 45 минутын үйлчилгээ 45 минутын өндөртэй яг харагдана —
  зөвхөн жагсаалт байхад ойлгогддоггүй "хэн хэзээ завтай вэ" гэдэг нь нэг
  харцаар мэдэгдэнэ.
*/

export const PX_PER_MIN = 1.4;

export type Column = {
  staff: Staff;
  bookings: {
    booking: Booking;
    startMin: number;
    durationMin: number;
    itemLabel: string;
  }[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-900 ring-amber-200",
  confirmed: "bg-primary-soft text-foreground ring-primary/30",
  done: "bg-sky-50 text-sky-900 ring-sky-200",
  no_show: "bg-zinc-100 text-zinc-600 ring-zinc-300",
  cancelled: "bg-surface-2 text-muted ring-border",
};

/** "10:00" -> 600 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function label(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export default function DayGrid({
  columns,
  openMin,
  closeMin,
  stepMin,
  nowMin,
}: {
  columns: Column[];
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

  return (
    <div className="no-scrollbar mt-4 overflow-x-auto">
      <div className="min-w-max">
        {/* Мастеруудын толгой — доош гүйлгэхэд наалдаж үлдэнэ. */}
        <div className="sticky top-0 z-30 flex bg-background/95 backdrop-blur">
          <div className="sticky left-0 z-10 w-14 shrink-0 bg-background/95 sm:w-16" />
          {columns.map((c) => (
            <div
              key={c.staff.id}
              className="w-[9.5rem] shrink-0 border-l border-border/60 px-2 py-3 text-center sm:w-[11rem]"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-base">
                {c.staff.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.staff.imageUrl}
                    alt={c.staff.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  c.staff.emoji
                )}
              </span>
              <p className="mt-1.5 truncate text-sm font-medium text-foreground">
                {c.staff.name}
              </p>
              <p className="text-[11px] text-muted">{c.bookings.length} захиалга</p>
            </div>
          ))}
        </div>

        {/* `relative` — "яг одоо" шугам энэ хайрцгийг дагаж байрлана. */}
        <div className="relative flex">
          {/* Цагийн багана */}
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
          </div>

          {columns.map((c) => (
            <div
              key={c.staff.id}
              className="relative w-[9.5rem] shrink-0 border-l border-border/60 sm:w-[11rem]"
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
                const blockHeight = Math.max(b.durationMin * PX_PER_MIN, 26);
                return (
                  <Link
                    key={b.booking.id}
                    href={`/admin/bookings?q=${b.booking.code}`}
                    style={{ top, height: blockHeight }}
                    className={`absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-left ring-1 transition-transform hover:z-10 hover:scale-[1.02] ${
                      STATUS_STYLES[b.booking.status] ?? STATUS_STYLES.confirmed
                    }`}
                  >
                    <span className="block truncate text-[11px] font-semibold tabular-nums">
                      {label(b.startMin)}
                    </span>
                    <span className="block truncate text-xs font-medium">
                      {b.booking.customerName}
                    </span>
                    {blockHeight > 52 && (
                      <span className="block truncate text-[11px] opacity-80">
                        {b.itemLabel}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/*
            "Яг одоо" шугам. Бүх баганыг дамнан татагдана — толгойд нь улаан
            цэгтэй, Fresha-гийн адил.
          */}
          {nowMin !== undefined && nowMin >= openMin && nowMin <= closeMin && (
            <span
              style={{ top: (nowMin - openMin) * PX_PER_MIN }}
              className="pointer-events-none absolute left-14 right-0 z-20 flex items-center sm:left-16"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              <span className="h-px flex-1 bg-rose-500" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
