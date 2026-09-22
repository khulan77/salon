"use client";

import CalendarLegend from "./calendar-legend";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Booking, Staff } from "@/app/lib/types";
import { formatPrice } from "@/app/lib/format";
import { adminMoveBookingAction } from "@/app/lib/actions";
import FitHeight from "./fit-height";
import ConfirmCheck from "./confirm-check";
import StarToggle from "./star-toggle";

/*
  Өдрийн хуанли — мастер бүр нэг багана, цаг доошоо урсана.

  Тор нь дэлгэцийн өндөрт багтана (`FitHeight`), шугам, блокуудыг ажлын
  цагийн хувиар байрлуулна. Ингэснээр нээхээс хаах хүртэлх бүх цаг доош
  гүйлгэлгүй харагдаж, 45 минутын үйлчилгээ 45 минутын өндөртэй хэвээр үлдэнэ —
  "хэн хэзээ завтай вэ" гэдэг нь нэг харцаар мэдэгдэнэ.
*/

/** Дэлгэц хэт намхан үед ч нэг минутад дор хаяж ийм пиксел ноогдоно. */
const MIN_PX_PER_MIN = 0.6;

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
 * Захиалга бүр өөрийн өнгөтэй — зэрэгцээ блокууд хоорондоо нийлж харагдахгүй.
 * Зүүн талын нарийн зурвас нь тод, дэвсгэр нь зөөлөн — олон блок зэрэг
 * харагдахад нүд ядрахгүй. Төлөвийг өнгөөр биш, баруун дээд булангийн
 * check-ээр ялгана (доорх тайлбарыг үз).
 */
const PALETTE = [
  { block: "bg-rose-100 text-rose-950", bar: "bg-rose-400" },
  { block: "bg-sky-100 text-sky-950", bar: "bg-sky-500" },
  { block: "bg-amber-100 text-amber-950", bar: "bg-amber-500" },
  { block: "bg-violet-100 text-violet-950", bar: "bg-violet-500" },
  { block: "bg-emerald-100 text-emerald-950", bar: "bg-emerald-500" },
  { block: "bg-orange-100 text-orange-950", bar: "bg-orange-400" },
  { block: "bg-teal-100 text-teal-950", bar: "bg-teal-500" },
  { block: "bg-fuchsia-100 text-fuchsia-950", bar: "bg-fuchsia-400" },
  { block: "bg-lime-100 text-lime-950", bar: "bg-lime-600" },
  { block: "bg-indigo-100 text-indigo-950", bar: "bg-indigo-400" },
];

/** Захиалгын id-аас тогтвортой тоо — нэг захиалга үргэлж нэг өнгөтэй байна. */
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Баганын захиалга бүрт өнгө ононо. Өнгө нь id-аас гарна, гэхдээ яг өмнөх
 * (дээрх) блоктой давхцвал дараагийн өнгийг авна — хөрш хоёр ижил өнгөтэй
 * болж, нэг урт захиалга мэт харагдахаас сэргийлнэ. Хамт захиалсан
 * үйлчилгээнүүд (өөр мастерууд зэрэг хийх) бүлгийн id-аараа ижил өнгөтэй —
 * нэг үйлчлүүлэгч гэдэг нь баганууд дундуур шууд танигдана.
 */
function colorsFor(bookings: CalBooking[]): Map<string, (typeof PALETTE)[number]> {
  const map = new Map<string, (typeof PALETTE)[number]>();
  let prev = -1;
  for (const b of [...bookings].sort((x, y) => x.startMin - y.startMin)) {
    let i = hashOf(b.booking.groupId ?? b.booking.id) % PALETTE.length;
    if (i === prev) i = (i + 1) % PALETTE.length;
    map.set(b.booking.id, PALETTE[i]);
    prev = i;
  }
  return map;
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
  editHrefs,
  createHref,
}: {
  columns: Column[];
  /** Блок дээр дарахад нээгдэх засах хуудасны холбоос. */
  /** Захиалга бүрийн modal нээх холбоос. Server-ээс serializable map-аар ирнэ. */
  editHrefs: Record<string, string>;
  /** Хоосон цаг дарахад шинэ захиалга нээх үндсэн холбоос. */
  createHref: string;
  /** Тухайн өдрийн цуцлагдсан захиалгууд — торыг бөглөхгүй, доор түүх болно. */
  cancelled: CalBooking[];
  openMin: number;
  closeMin: number;
  /** Хэвтээ шугамын алхам — ихэвчлэн 30 минут. */
  stepMin: number;
  /** Улаан "яг одоо" шугам. Өнөөдрийг харж байгаа үед л дамжуулна. */
  nowMin?: number;
}) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStaffId, setOverStaffId] = useState<string | null>(null);
  const [moveMessage, setMoveMessage] = useState<string | null>(null);
  const [moving, startMove] = useTransition();
  const totalMin = Math.max(60, closeMin - openMin);
  const lines = Math.ceil(totalMin / stepMin);
  /** Ажлын цагийн эхнээс хэдэн хувьд байх вэ — шугам, блокны байрлал. */
  const pct = (min: number) => `${(min / totalMin) * 100}%`;
  const showNow = nowMin !== undefined && nowMin >= openMin && nowMin <= closeMin;

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
                  href={editHrefs[b.booking.id]}
                  scroll={false}
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

      <div className="no-scrollbar mt-2 overflow-x-auto sm:mt-0">
        {/* `pb-2` — хамгийн доод цагийн шошго хагас нь доош цухуйдаг тул. */}
        <div className="w-full pb-2 sm:min-w-[var(--calendar-min-width)]"
          style={{ "--calendar-min-width": `calc(3.5rem + ${columns.length} * 9rem)` } as React.CSSProperties}>
          {/* Мастеруудын толгой */}
          <div className="sticky top-16 z-20 flex bg-surface sm:static sm:bg-background">
            <div className="sticky left-0 z-10 w-10 shrink-0 bg-background sm:w-14" />
            {columns.map((c) => {
              const total = c.bookings.reduce((sum, b) => sum + b.price, 0);
              return (
                <div
                  key={c.staff.id}
                  onClick={(event) => {
                    if (moving || draggingId) return;
                    const target = event.target;
                    if (target instanceof Element && target.closest(".cal-block")) return;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const relativeY = Math.max(
                      0,
                      Math.min(bounds.height, event.clientY - bounds.top),
                    );
                    const rawMinute = openMin + (relativeY / bounds.height) * totalMin;
                    const targetMinute = Math.max(
                      openMin,
                      Math.min(closeMin - stepMin, Math.round(rawMinute / stepMin) * stepMin),
                    );
                    const separator = createHref.includes("?") ? "&" : "?";
                    router.push(
                      `${createHref}${separator}staff=${encodeURIComponent(c.staff.id)}&time=${encodeURIComponent(label(targetMinute))}`,
                      { scroll: false },
                    );
                  }}
                  className="min-w-0 flex-1 border-l border-border/60 px-0.5 py-2 sm:min-w-[9rem] sm:px-3 sm:py-2.5"
                >
                  <div className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-2">
                    {c.staff.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.staff.imageUrl}
                        alt={c.staff.name}
                        className="h-8 w-8 max-w-full shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 max-w-full shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                        {initials(c.staff.name)}
                      </span>
                    )}
                    <p className="w-full whitespace-normal break-all text-center text-[10px] font-medium leading-tight text-foreground sm:w-auto sm:truncate sm:text-left sm:text-sm">
                      {c.staff.name}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-center text-[9px] text-muted sm:text-left sm:text-[11px]">
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
          <FitHeight
            className="relative flex"
            minHeight={totalMin * MIN_PX_PER_MIN}
            reserve={72}
          >
            {/* Хажуу тийш гүйлгэхэд цагийн багана байрандаа үлдэнэ — эс тэгвэл
                утсан дээр баруун тийш гүйлгэхэд аль цаг болох нь мэдэгдэхгүй.
                Тор шахагдсан тул зөвхөн бүтэн цагийг бичнэ. */}
            <div className="sticky left-0 z-10 w-10 shrink-0 bg-background sm:w-14">
              {Array.from({ length: lines + 1 }, (_, i) => {
                const min = openMin + i * stepMin;
                if (min % 60 !== 0 || min > openMin + totalMin) return null;
                return (
                  <span
                    key={min}
                    style={{ top: pct(min - openMin) }}
                    className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted"
                  >
                    {label(min)}
                  </span>
                );
              })}

              {/* Одоогийн цагийн шошго */}
              {showNow && (
                <span
                  style={{ top: pct(nowMin - openMin) }}
                  className="absolute right-1 z-20 -translate-y-1/2 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white"
                >
                  {label(nowMin)}
                </span>
              )}
            </div>

            {columns.map((c) => {
              const colors = colorsFor(c.bookings);
              return (
                <div
                  key={c.staff.id}
                  onDragOver={(event) => {
                    if (!draggingId) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setOverStaffId(c.staff.id);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setOverStaffId(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const bookingId = event.dataTransfer.getData("text/plain") || draggingId;
                    setDraggingId(null);
                    setOverStaffId(null);
                    if (!bookingId) return;
                    const source = columns.flatMap((column) => column.bookings).find((block) => block.booking.id === bookingId);
                    if (!source) return;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const relativeY = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
                    const dragOffset = Number(
                      event.dataTransfer.getData("application/x-booking-offset"),
                    ) || 0;
                    const rawMinute =
                      openMin + (relativeY / bounds.height) * totalMin - dragOffset;
                    const snappedMinute = Math.round(rawMinute / stepMin) * stepMin;
                    const targetMinute = Math.max(
                      openMin,
                      Math.min(closeMin - source.durationMin, snappedMinute),
                    );
                    const targetTime = label(targetMinute);
                    if (
                      source.booking.staffId === c.staff.id &&
                      source.booking.time.slice(0, 5) === targetTime
                    ) return;
                    startMove(async () => {
                      const data = new FormData();
                      data.set("id", bookingId);
                      data.set("staffId", c.staff.id);
                      data.set("time", targetTime);
                      const result = await adminMoveBookingAction({ status: "idle" }, data);
                      if (result.status === "error") setMoveMessage(result.message);
                      else {
                        setMoveMessage(
                          `✓ ${source.booking.customerName} → ${c.staff.name}, ${targetTime}`,
                        );
                        router.refresh();
                      }
                    });
                  }}
                  className={`relative min-w-0 flex-1 cursor-crosshair border-l border-border/60 transition-colors sm:min-w-[9rem] ${
                    overStaffId === c.staff.id ? "bg-primary-soft/70 ring-2 ring-inset ring-primary/40" : ""
                  }`}
                >
                  {/* Хэвтээ шугамууд */}
                  {Array.from({ length: lines }, (_, i) => (
                    <span
                      key={i}
                      style={{ top: pct(i * stepMin) }}
                      className={`absolute inset-x-0 border-t ${
                        (openMin + i * stepMin) % 60 === 0
                          ? "border-border/70"
                          : "border-dashed border-border/40"
                      }`}
                    />
                  ))}

                  {c.bookings.map((b) => {
                    const color = colors.get(b.booking.id) ?? PALETTE[0];
                    const endMin = b.startMin + b.durationMin;
                    const status = b.booking.status;
                    return (
                      <div
                        key={b.booking.id}
                        draggable={
                          !moving &&
                          !b.booking.staffLocked &&
                          (status === "pending" || status === "confirmed")
                        }
                        onDragStart={(event) => {
                          setMoveMessage(null);
                          setDraggingId(b.booking.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", b.booking.id);
                          const bounds = event.currentTarget.getBoundingClientRect();
                          const ratio = Math.max(
                            0,
                            Math.min(1, (event.clientY - bounds.top) / bounds.height),
                          );
                          event.dataTransfer.setData(
                            "application/x-booking-offset",
                            String(ratio * b.durationMin),
                          );
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverStaffId(null);
                        }}
                        style={{
                          top: pct(b.startMin - openMin),
                          height: pct(b.durationMin),
                        }}
                        title={`${b.booking.customerName} · ${label(b.startMin)}–${label(endMin)} · ${b.itemLabel} · ${formatPrice(b.price)}${
                          b.booking.groupId ? " · хамт захиалсан" : ""
                        }`}
                        className={`cal-block absolute inset-x-px sm:inset-x-1 min-h-[18px] overflow-hidden rounded-lg text-left shadow-[0_1px_2px_rgba(46,39,35,0.08)] transition-transform hover:z-10 hover:scale-[1.02] ${color.block} ${
                          !b.booking.staffLocked && (status === "pending" || status === "confirmed") ? "cursor-grab active:cursor-grabbing" : ""
                        } ${draggingId === b.booking.id ? "z-30 opacity-50" : ""} ${
                          status === "no_show" ? "opacity-50" : ""
                        }`}
                      >
                        {/* Зүүн талын өнгөт зурвас */}
                        <span
                          className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${color.bar}`}
                        />

                        {/* Блок бүхэлдээ засах хуудас руу. Холбоос дотор товч
                            байж болохгүй тул холбоос нь доод давхаргад хоосон,
                            бичвэр нь дээр нь `pointer-events-none` — дарахад
                            холбоос руу нэвтэрнэ, харин од, check нь тусдаа товч. */}
                        <Link
                          href={editHrefs[b.booking.id]}
                          scroll={false}
                          aria-label={`${b.booking.customerName} — засах`}
                          className="absolute inset-0"
                        />

                        {/* Блокны өндрөөс хамаарч аль мөр харагдахыг
                            globals.css-ийн `.cal-block` шийднэ. */}
                        <div className="cal-body pointer-events-none relative flex h-full flex-col">
                          <span className="cal-time truncate pr-4 text-[10px] tabular-nums opacity-70">
                            {label(b.startMin)}–{label(endMin)}
                            {b.booking.groupId && " · 👥"}
                          </span>
                          <span className="cal-customer flex min-w-0 items-center pr-4">
                            {/* ★ өнгөтэй — тогтмол мастер, ☆ — энгийн. */}
                            <StarToggle
                              id={b.booking.id}
                              locked={Boolean(b.booking.staffLocked)}
                              size="sm"
                            />
                            <span
                              className={`truncate text-[12px] font-semibold leading-tight ${
                                status === "no_show" ? "line-through" : ""
                              }`}
                            >
                              {b.booking.customerName}
                            </span>
                          </span>
                          <span className="cal-item truncate text-[11px] opacity-75">
                            {b.itemLabel}
                          </span>
                          {b.price > 0 && (
                            <span className="cal-price mt-auto truncate text-right text-[11px] font-semibold tabular-nums">
                              {formatPrice(b.price)}
                            </span>
                          )}
                        </div>

                        {/* Check: баталгаажсан ↔ хүлээгдэж буй. Дууссан бол
                            ногоон тэмдэг, ирээгүй бол бүдэг — check байхгүй. */}
                        {(status === "pending" || status === "confirmed") && (
                          <ConfirmCheck
                            id={b.booking.id}
                            confirmed={status === "confirmed"}
                          />
                        )}
                        {status === "done" && (
                          <span
                            aria-label="Дууссан"
                            className="absolute right-1 top-1 flex h-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[8px] font-bold leading-none tracking-[-0.15em] text-white"
                          >
                            ✓✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* "Яг одоо" шугам — бүх баганыг дамнана. */}
            {showNow && (
              <span
                style={{ top: pct(nowMin - openMin) }}
                className="pointer-events-none absolute left-10 right-0 z-20 sm:left-14 h-px bg-rose-500"
              />
            )}
          </FitHeight>
        </div>
      </div>

      {/* Төлөвийн тайлбар — өнгө нь захиалга бүрийг ялгана, тэмдэг нь төлөвийг. */}
      <div className="hidden sm:block"><CalendarLegend /></div>

      <p className="mt-2 hidden text-xs text-muted sm:block">
        Хоосон цаг дээр дарж захиалга нэмнэ. Захиалгыг чирж цаг, ажилтныг өөрчилнө.
      </p>

      {moveMessage && (
        <button
          type="button"
          onClick={() => setMoveMessage(null)}
          className={`fixed bottom-5 left-1/2 z-[60] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-medium shadow-lg ${
            moveMessage.startsWith("✓") ? "bg-emerald-700 text-white" : "bg-rose-700 text-white"
          }`}
        >
          {moveMessage}
        </button>
      )}

      {/* Өдрийн мөнгөн дүн — Fresha-гийн адил доод мөрөнд. */}
      <div className="mt-3 hidden flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border/60 pt-3 text-sm sm:flex">
        <span className="text-muted">
          Өдрийн нийт{" "}
          <b className="font-display text-lg font-semibold text-foreground">
            {formatPrice(dayTotal)}
          </b>
        </span>
        <span className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
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
