"use client";

import CalendarLegend from "@/app/admin/(dash)/calendar/calendar-legend";
import { useCallback, useEffect, useState } from "react";
import FitHeight from "@/app/admin/(dash)/calendar/fit-height";
import {
  WEEKDAYS,
  branchOf,
  branches,
  canDo,
  dateOf,
  dayLabel,
  dayMonth,
  freeSlots,
  hhmm,
  isFree,
  itemInfo,
  money,
  packages,
  services,
  staff,
  type DemoBooking,
  type Status,
} from "./demo-data";

/*
  Хуанлийн ҮЗҮҮЛЭН — жинхэнэ `/admin/calendar`-ын хуулбар, жишээ өгөгдөл дээр.
  Мастер бүр нэг багана, цаг доошоо урсана; блок дээр дарахад захиалгын хуудас
  гарна. Бүх өөрчлөлт зөвхөн хөтчийн санах ойд — хуудсыг сэргээхэд эхэндээ
  буцна. Жинхэнэ хуанлийн серверийн үйлдлүүд (server actions) энд огт хэрэглэгдэхгүй.
*/

export type CalView = "day" | "15" | "30";
export type CalState = { day: number; branchId: string; view: CalView; openId?: string };

const VIEWS: { key: CalView; label: string; days: number }[] = [
  { key: "day", label: "Өдөр", days: 1 },
  { key: "15", label: "15 хоног", days: 15 },
  { key: "30", label: "30 хоног", days: 30 },
];

/** Дэлгэц хэт намхан үед ч нэг минутад дор хаяж ийм пиксел ноогдоно. */
const MIN_PX_PER_MIN = 0.6;
const STEP_MIN = 30;

/** Жинхэнэ хуанлийн өнгөнүүд — захиалга бүр өөрийн өнгөтэй. */
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

function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Хөрш хоёр блок ижил өнгөтэй болохгүй; хамт захиалсан нь нэг өнгөтэй. */
function colorsFor(list: DemoBooking[]) {
  const map = new Map<string, (typeof PALETTE)[number]>();
  let prev = -1;
  for (const b of [...list].sort((x, y) => x.start - y.start)) {
    let i = hashOf(b.groupId ?? b.code) % PALETTE.length;
    if (i === prev) i = (i + 1) % PALETTE.length;
    map.set(b.id, PALETTE[i]);
    prev = i;
  }
  return map;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

const staffName = (id: string) => staff.find((m) => m.id === id)?.name ?? "—";

type Props = {
  today: Date;
  nowMin: number;
  bookings: DemoBooking[];
  setBookings: React.Dispatch<React.SetStateAction<DemoBooking[]>>;
  cal: CalState;
  setCal: React.Dispatch<React.SetStateAction<CalState>>;
  notify: (message: string) => void;
};

export default function DemoCalendar({
  today,
  nowMin,
  bookings,
  setBookings,
  cal,
  setCal,
  notify,
}: Props) {
  const [adding, setAdding] = useState(false);
  const stopAdding = useCallback(() => setAdding(false), []);

  const view = VIEWS.find((v) => v.key === cal.view) ?? VIEWS[0];
  const branch = branches.find((b) => b.id === cal.branchId) ?? branches[0];
  const columnsStaff = staff.filter((m) => m.branchId === branch.id);
  const staffIds = new Set(columnsStaff.map((m) => m.id));
  const weekdayOf = (day: number) => dateOf(today, day).getDay();

  const date = dateOf(today, cal.day);
  const lastDay = cal.day + view.days - 1;
  const inRange = bookings.filter(
    (b) => staffIds.has(b.staffId) && b.day >= cal.day && b.day <= lastDay,
  );
  const active = inRange.filter((b) => b.status !== "cancelled");
  const cancelledCount = inRange.length - active.length;
  const dayBookings = active.filter((b) => b.day === cal.day);
  const cancelledToday = inRange
    .filter((b) => b.day === cal.day && b.status === "cancelled")
    .sort((a, b) => a.start - b.start);

  const { openMin, closeMin } = branch;
  const closed = branch.closedDays.includes(weekdayOf(cal.day));
  const durationOf = (b: DemoBooking) => itemInfo(b.item).durationMin;

  // Ачаалал — захиалсан минут / нийт боломжит минут (амарсан өдрийг тооцохгүй).
  const dailyCapacity = columnsStaff.length * (closeMin - openMin);
  const cells = Array.from({ length: view.days }, (_, i) => {
    const day = cal.day + i;
    const dayClosed = branch.closedDays.includes(weekdayOf(day));
    const list = active.filter((b) => b.day === day);
    const booked = list.reduce((sum, b) => sum + durationOf(b), 0);
    return {
      day,
      count: list.length,
      closed: dayClosed,
      loadPercent:
        dayClosed || dailyCapacity === 0 ? 0 : Math.round((booked / dailyCapacity) * 100),
    };
  });
  const workingDays = cells.filter((c) => !c.closed).length;
  const bookedMin = active.reduce((sum, b) => sum + durationOf(b), 0);
  const capacityMin = dailyCapacity * workingDays;
  const loadPercent = capacityMin > 0 ? Math.round((bookedMin / capacityMin) * 100) : 0;
  const freeHours = Math.max(0, Math.round((capacityMin - bookedMin) / 60));

  const stats = [
    { label: "Захиалга", value: String(active.length) },
    { label: "Ажиллах мастер", value: String(columnsStaff.length) },
    { label: "Ачаалал", value: `${loadPercent}%` },
    { label: "Чөлөөт цаг", value: `${freeHours} ц` },
    { label: "Цуцлагдсан", value: String(cancelledCount) },
  ];

  const go = (patch: Partial<CalState>) => setCal((c) => ({ ...c, openId: undefined, ...patch }));
  const close = useCallback(() => setCal((c) => ({ ...c, openId: undefined })), [setCal]);

  const update = (id: string, patch: Partial<DemoBooking>) =>
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, ...patch, fresh: false } : b)));

  const open = (b: DemoBooking) => {
    if (b.fresh) update(b.id, {});
    setCal((c) => ({ ...c, openId: b.id }));
  };

  const toggleConfirm = (b: DemoBooking) => {
    const next: Status = b.status === "confirmed" ? "pending" : "confirmed";
    update(b.id, { status: next });
    notify(
      next === "confirmed"
        ? `✓ ${b.name} — баталгаажлаа. Үйлчлүүлэгчид SMS очлоо`
        : `${b.name} — баталгаажаагүй болголоо`,
    );
  };

  const toggleStar = (b: DemoBooking) => {
    update(b.id, { locked: !b.locked });
    notify(
      b.locked
        ? `☆ ${b.name} — тогтмол мастер болиулсан`
        : `★ ${b.name} — зөвхөн ${staffName(b.staffId)} дээр үйлчлүүлнэ`,
    );
  };

  const opened = cal.openId ? bookings.find((b) => b.id === cal.openId) : undefined;
  const strip = Array.from({ length: 7 }, (_, i) => cal.day - 1 + i);
  const last = dateOf(today, lastDay);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => go({ day: 0 })}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              cal.day === 0
                ? "bg-foreground text-background"
                : "bg-surface-2 text-foreground hover:bg-primary-soft"
            }`}
          >
            Өнөөдөр
          </button>
          <button
            type="button"
            onClick={() => go({ day: cal.day - view.days })}
            aria-label="Өмнөх"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:text-primary"
          >
            ‹
          </button>
          <h1 className="min-w-0 font-display text-lg font-semibold text-foreground sm:text-2xl">
            {dayMonth(date)} / {date.getFullYear()}{" "}
            <span className="text-muted">
              {view.key === "day" ? WEEKDAYS[date.getDay()] : `— ${dayMonth(last)}`}
            </span>
          </h1>
          <button
            type="button"
            onClick={() => go({ day: cal.day + view.days })}
            aria-label="Дараах"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:text-primary"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="min-h-10 shrink-0 rounded-full bg-primary px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          + Захиалга
        </button>
      </div>

      {/* Салбар сэлгэгч */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {branches.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => go({ branchId: l.id })}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              branch.id === l.id
                ? "bg-surface text-foreground shadow-sm"
                : "bg-surface-2/70 text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${branch.id === l.id ? "bg-primary" : "bg-border"}`}
            />
            {l.name}
          </button>
        ))}
      </div>

      {/* Долоо хоногийн зурвас — өчигдрөөс эхлээд 7 хоног */}
      {view.key === "day" && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {strip.map((d) => {
            const on = d === cal.day;
            return (
              <button
                key={d}
                type="button"
                onClick={() => go({ day: d })}
                className={`flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 transition-colors ${
                  on ? "bg-primary text-white" : "bg-surface-2/60 text-foreground hover:bg-primary-soft"
                }`}
              >
                <span className={`text-[10px] ${on ? "text-white/80" : "text-muted"}`}>
                  {d === 0 ? "Өнөөдөр" : WEEKDAYS[weekdayOf(d)].slice(0, 2)}
                </span>
                <span className="text-base font-semibold tabular-nums">
                  {dateOf(today, d).getDate()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Товч тоонууд ба харагдацын сэлгэгч */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-border/60 py-3">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-5 overflow-x-auto sm:gap-8">
          {stats.map((s) => (
            <span key={s.label} className="flex shrink-0 items-baseline gap-1.5 text-sm">
              <span className="text-muted">{s.label}</span>
              <span className="font-semibold text-foreground">{s.value}</span>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 rounded-full bg-surface-2/70 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => go({ view: v.key })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                view.key === v.key ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view.key === "day" && !closed && (
        <p className="mt-3 text-xs leading-5 text-muted">
          💡 Блок дээр дарж захиалгыг нээнэ. Баруун дээд ✓ — баталгаажуулах, нэрний
          өмнөх ☆ — тогтмол мастер болгох.
        </p>
      )}

      {closed && view.key === "day" && (
        <p className="mt-4 rounded-2xl bg-surface-2/70 px-4 py-3 text-sm text-muted">
          🌙 {branch.name} энэ өдөр амарна — онлайнаар захиалга орохгүй. Өөр өдөр
          эсвэл Төв салбарыг сонгоод үзээрэй.
        </p>
      )}

      {view.key === "day" ? (
        <DayGrid
          columns={columnsStaff.map((m) => ({
            id: m.id,
            name: m.name,
            bookings: dayBookings.filter((b) => b.staffId === m.id),
          }))}
          cancelled={cancelledToday}
          openMin={openMin}
          closeMin={closeMin}
          nowMin={cal.day === 0 ? nowMin : undefined}
          onOpen={open}
          onConfirm={toggleConfirm}
          onStar={toggleStar}
        />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {cells.map((c) => {
              const d = dateOf(today, c.day);
              return (
                <button
                  key={c.day}
                  type="button"
                  onClick={() => go({ day: c.day, view: "day" })}
                  className={`flex flex-col rounded-2xl px-3 py-3 text-left transition-colors ${
                    c.day === 0
                      ? "bg-primary-soft ring-2 ring-primary"
                      : c.closed
                        ? "bg-surface-2/40"
                        : "bg-surface-2/60 hover:bg-primary-soft/70"
                  } ${c.day < 0 ? "opacity-60" : ""}`}
                >
                  <span className="flex items-baseline justify-between gap-1">
                    <span className="text-[11px] text-muted">{WEEKDAYS[d.getDay()].slice(0, 2)}</span>
                    <span className="font-display text-lg font-semibold leading-none text-foreground">
                      {d.getDate()}
                    </span>
                  </span>
                  {c.closed ? (
                    <span className="mt-3 text-[11px] text-muted">Амарна</span>
                  ) : (
                    <>
                      <span className="mt-3 block h-1.5 rounded-full bg-surface">
                        <span
                          style={{ width: `${Math.min(100, c.loadPercent)}%` }}
                          className={`block h-full rounded-full ${
                            c.loadPercent >= 80 ? "bg-primary" : "bg-primary/60"
                          }`}
                        />
                      </span>
                      <span className="mt-1.5 text-[11px] text-muted">
                        {c.count > 0 ? `${c.count} захиалга · ${c.loadPercent}%` : "Сул"}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted">
            Аль өдөр сул байгааг нэг харцаар олно. Өдөр дээр дарвал тухайн өдрийн
            дэлгэрэнгүй хуваарь нээгдэнэ.
          </p>
        </>
      )}

      {opened && (
        <BookingSheet
          key={opened.id}
          booking={opened}
          bookings={bookings}
          today={today}
          onClose={close}
          onOpen={open}
          onSaved={(day) => setCal((c) => ({ ...c, day, branchId: branchOf(opened.staffId) }))}
          update={update}
          notify={notify}
        />
      )}

      {adding && (
        <NewBookingSheet
          bookings={bookings}
          branchId={branch.id}
          initialDay={Math.max(0, cal.day)}
          today={today}
          onClose={stopAdding}
          onAdd={(b) => {
            setBookings((list) => [
              ...list,
              { ...b, id: `n${list.length + 1}`, code: `LM-${5000 + list.length}` },
            ]);
            setAdding(false);
            go({ day: b.day, view: "day" });
            notify(`✓ ${b.name} — ${dayLabel(today, b.day)} ${hhmm(b.start)}-д бүртгэгдлээ`);
          }}
        />
      )}
    </div>
  );
}

/* ── Өдрийн тор ────────────────────────────────────────────────────── */

function DayGrid({
  columns,
  cancelled,
  openMin,
  closeMin,
  nowMin,
  onOpen,
  onConfirm,
  onStar,
}: {
  columns: { id: string; name: string; bookings: DemoBooking[] }[];
  cancelled: DemoBooking[];
  openMin: number;
  closeMin: number;
  nowMin?: number;
  onOpen: (b: DemoBooking) => void;
  onConfirm: (b: DemoBooking) => void;
  onStar: (b: DemoBooking) => void;
}) {
  const totalMin = Math.max(60, closeMin - openMin);
  const lines = Math.ceil(totalMin / STEP_MIN);
  const pct = (min: number) => `${(min / totalMin) * 100}%`;
  const showNow = nowMin !== undefined && nowMin >= openMin && nowMin <= closeMin;

  const all = columns.flatMap((c) => c.bookings);
  const priceOf = (b: DemoBooking) => itemInfo(b.item).price;
  const dayTotal = all.reduce((sum, b) => sum + priceOf(b), 0);
  const dayPaid = all.reduce((sum, b) => sum + Math.min(b.paid, priceOf(b)), 0);

  // Шинэ захиалга ирэхэд тэр блок руу гүйлгэнэ — утсан дээр 3-р баганад
  // байсан ч дэлгэцэнд гарч ирнэ.
  const freshId = all.find((b) => b.fresh)?.id;
  useEffect(() => {
    if (!freshId) return;
    document
      .getElementById(`blk-${freshId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }, [freshId]);

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
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onOpen(b)}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface-2/50 px-3 py-2 text-left text-xs text-muted transition-colors hover:text-foreground"
                >
                  <span className="tabular-nums">{hhmm(b.start)}</span>
                  <span className="truncate font-medium text-foreground/70 line-through">{b.name}</span>
                  <span className="truncate">{itemInfo(b.item).label}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="no-scrollbar mt-4 overflow-x-auto">
        <div className="w-full pb-2 sm:min-w-[var(--calendar-min-width)]"
          style={{ "--calendar-min-width": `calc(3.5rem + ${columns.length} * 9rem)` } as React.CSSProperties}>
          {/* Мастеруудын толгой */}
          <div className="flex bg-background">
            <div className="sticky left-0 z-10 w-10 shrink-0 bg-background sm:w-14" />
            {columns.map((c) => {
              const total = c.bookings.reduce((sum, b) => sum + priceOf(b), 0);
              return (
                <div key={c.id} className="min-w-0 flex-1 border-l border-border/60 px-0.5 py-2 sm:min-w-[9rem] sm:px-3 sm:py-2.5">
                  <div className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-2">
                    <span className="flex h-8 w-8 max-w-full shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                      {initials(c.name)}
                    </span>
                    <p className="w-full whitespace-normal break-all text-center text-[10px] font-medium leading-tight text-foreground sm:w-auto sm:truncate sm:text-left sm:text-sm">{c.name}</p>
                  </div>
                  <p className="mt-1 truncate text-center text-[9px] text-muted sm:text-left sm:text-[11px]">
                    {c.bookings.length} захиалга
                    {total > 0 && (
                      <>
                        {" · "}
                        <b className="font-semibold text-foreground">{money(total)}</b>
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <FitHeight className="relative flex" minHeight={totalMin * MIN_PX_PER_MIN} reserve={112}>
            {/* Цагийн багана — хажуу тийш гүйлгэхэд байрандаа үлдэнэ */}
            <div className="sticky left-0 z-10 w-10 shrink-0 bg-background sm:w-14">
              {Array.from({ length: lines + 1 }, (_, i) => {
                const min = openMin + i * STEP_MIN;
                if (min % 60 !== 0 || min > openMin + totalMin) return null;
                return (
                  <span
                    key={min}
                    style={{ top: pct(min - openMin) }}
                    className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted"
                  >
                    {hhmm(min)}
                  </span>
                );
              })}
              {showNow && (
                <span
                  style={{ top: pct(nowMin - openMin) }}
                  className="absolute right-1 z-20 -translate-y-1/2 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white"
                >
                  {hhmm(nowMin)}
                </span>
              )}
            </div>

            {columns.map((c) => {
              const colors = colorsFor(c.bookings);
              return (
                <div key={c.id} className="relative min-w-0 flex-1 border-l border-border/60 sm:min-w-[9rem]">
                  {Array.from({ length: lines }, (_, i) => (
                    <span
                      key={i}
                      style={{ top: pct(i * STEP_MIN) }}
                      className={`absolute inset-x-0 border-t ${
                        (openMin + i * STEP_MIN) % 60 === 0
                          ? "border-border/70"
                          : "border-dashed border-border/40"
                      }`}
                    />
                  ))}

                  {c.bookings.map((b) => {
                    const info = itemInfo(b.item);
                    const color = colors.get(b.id) ?? PALETTE[0];
                    const end = b.start + info.durationMin;
                    return (
                      <div
                        key={b.id}
                        id={`blk-${b.id}`}
                        style={{ top: pct(b.start - openMin), height: pct(info.durationMin) }}
                        title={`${b.name} · ${hhmm(b.start)}–${hhmm(end)} · ${info.label} · ${money(info.price)}${
                          b.groupId ? " · хамт захиалсан" : ""
                        }`}
                        className={`cal-block absolute inset-x-px sm:inset-x-1 min-h-[18px] overflow-hidden rounded-lg text-left shadow-[0_1px_2px_rgba(46,39,35,0.08)] transition-transform hover:z-10 hover:scale-[1.02] ${color.block} ${
                          b.status === "no_show" ? "opacity-50" : ""
                        } ${b.fresh ? "animate-fade-up ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                      >
                        <span className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${color.bar}`} />

                        {/* Блок бүхэлдээ захиалгын хуудас нээнэ; од, check тусдаа товч. */}
                        <button
                          type="button"
                          onClick={() => onOpen(b)}
                          aria-label={`${b.name} — нээх`}
                          className="absolute inset-0"
                        />

                        <div className="cal-body pointer-events-none relative flex h-full flex-col">
                          <span className="cal-time truncate pr-4 text-[10px] tabular-nums opacity-70">
                            {hhmm(b.start)}–{hhmm(end)}
                            {b.groupId && " · 👥"}
                          </span>
                          <span className="flex min-w-0 items-center pr-4">
                            <button
                              type="button"
                              onClick={() => onStar(b)}
                              aria-pressed={Boolean(b.locked)}
                              aria-label={b.locked ? "Тогтмол мастер — дарж болиулах" : "Тогтмол мастер болгох"}
                              className={`pointer-events-auto relative z-10 -my-1 -ml-1 mr-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-1 text-[13px] leading-none transition-colors ${
                                b.locked ? "text-amber-500" : "text-current opacity-35 hover:opacity-80"
                              }`}
                            >
                              {b.locked ? "★" : "☆"}
                            </button>
                            <span
                              className={`truncate text-[12px] font-semibold leading-tight ${
                                b.status === "no_show" ? "line-through" : ""
                              }`}
                            >
                              {b.name}
                            </span>
                          </span>
                          <span className="cal-item truncate text-[11px] opacity-75">{info.label}</span>
                          <span className="cal-price mt-auto truncate text-right text-[11px] font-semibold tabular-nums">
                            {money(info.price)}
                          </span>
                        </div>

                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={b.status === "confirmed"}
                            aria-label={b.status === "confirmed" ? "Баталгаажсан — дарж болиулах" : "Баталгаажуулах"}
                            onClick={() => onConfirm(b)}
                            className="absolute right-0 top-0 z-10 p-1"
                          >
                            <CheckBox checked={b.status === "confirmed"} />
                          </button>
                        )}
                        {b.status === "done" && (
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

            {showNow && (
              <span
                style={{ top: pct(nowMin - openMin) }}
                className="pointer-events-none absolute left-10 right-0 z-20 sm:left-14 h-px bg-rose-500"
              />
            )}
          </FitHeight>
        </div>
      </div>

      {/* Тайлбар — өнгө нь захиалга бүрийг, тэмдэг нь төлөвийг ялгана */}
      <CalendarLegend />

      {/* Өдрийн мөнгөн дүн */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border/60 pt-3 text-sm">
        <span className="text-muted">
          Өдрийн нийт{" "}
          <b className="font-display text-lg font-semibold text-foreground">{money(dayTotal)}</b>
        </span>
        <span className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
          <span>
            Төлөгдсөн <b className="text-emerald-700">{money(dayPaid)}</b>
          </span>
          <span>
            Үлдэгдэл <b className="text-foreground">{money(Math.max(0, dayTotal - dayPaid))}</b>
          </span>
        </span>
      </div>
    </div>
  );
}

function CheckBox({ checked, small, large }: { checked: boolean; small?: boolean; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center font-bold leading-none transition-colors ${
        large ? "h-6 w-6 rounded-md text-sm" : small ? "h-3 w-3 rounded-[3px] text-[8px]" : "h-4 w-4 rounded-md text-[10px]"
      } ${
        checked ? "bg-emerald-600 text-white" : "bg-white text-transparent ring-2 ring-inset ring-rose-400"
      }`}
    >
      ✓
    </span>
  );
}

/* ── Доороос гарах хуудас ─────────────────────────────────────────── */

function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Esc дарахад хаана, нээлттэй үед ард нь байгаа хуудас гүйлгэгдэхгүй.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Хаах"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="animate-fade-up relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Хаах"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg text-muted transition-colors hover:text-foreground"
    >
      ×
    </button>
  );
}

const STATUS_BADGE: Record<Status, { text: string; className: string }> = {
  pending: { text: "Хүлээгдэж буй", className: "bg-accent/15 text-accent" },
  confirmed: { text: "Баталгаажсан", className: "bg-emerald-50 text-emerald-700" },
  done: { text: "Дууссан", className: "bg-sky-50 text-sky-700" },
  no_show: { text: "Ирээгүй", className: "bg-surface-2 text-muted" },
  cancelled: { text: "Цуцлагдсан", className: "bg-rose-50 text-rose-600" },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${s.className}`}>
      {s.text}
    </span>
  );
}

function BookingSheet({
  booking,
  bookings,
  today,
  onClose,
  onOpen,
  onSaved,
  update,
  notify,
}: {
  booking: DemoBooking;
  bookings: DemoBooking[];
  today: Date;
  onClose: () => void;
  onOpen: (b: DemoBooking) => void;
  onSaved: (day: number) => void;
  update: (id: string, patch: Partial<DemoBooking>) => void;
  notify: (message: string) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const info = itemInfo(booking.item);
  const checkable = booking.status === "pending" || booking.status === "confirmed";
  const editable = booking.status === "pending";
  const locked = Boolean(booking.locked);
  const master = staffName(booking.staffId);
  const siblings = booking.groupId
    ? bookings.filter((b) => b.groupId === booking.groupId && b.id !== booking.id)
    : [];
  const balance = Math.max(0, info.price - booking.paid);

  return (
    <Sheet label={`${booking.name} — захиалга`} onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            {checkable && (
              <button
                type="button"
                aria-pressed={locked}
                aria-label={locked ? "Тогтмол мастер — дарж болиулах" : "Тогтмол мастер болгох"}
                onClick={() => {
                  update(booking.id, { locked: !locked });
                  notify(locked ? "☆ Тогтмол мастер болиулсан" : `★ Зөвхөн ${master} дээр үйлчлүүлнэ`);
                }}
                className={`-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none transition-colors ${
                  locked ? "text-amber-400 hover:bg-amber-50" : "text-border hover:bg-surface-2 hover:text-amber-300"
                }`}
              >
                {locked ? "★" : "☆"}
              </button>
            )}
            <h2 className="truncate font-display text-xl font-semibold text-foreground">{booking.name}</h2>
            {!checkable && <StatusBadge status={booking.status} />}
          </div>
          {locked && (
            <p className="mt-0.5 text-xs text-amber-700">
              ★ Тогтмол мастер: {master} — өөр мастер руу шилжүүлэхгүй.
            </p>
          )}
          <p className="mt-0.5 text-sm text-muted">
            <a href={`tel:${booking.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
              📞 {booking.phone}
            </a>
            <span className="ml-2 font-mono text-xs tracking-[0.15em]">{booking.code}</span>
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      {checkable && (
        <button
          type="button"
          role="checkbox"
          aria-checked={booking.status === "confirmed"}
          onClick={() => {
            const next: Status = booking.status === "confirmed" ? "pending" : "confirmed";
            update(booking.id, { status: next });
            notify(next === "confirmed" ? "✓ Баталгаажлаа — үйлчлүүлэгчид SMS очлоо" : "Баталгаажуулалтыг болиулсан");
          }}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-surface-2/70 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
        >
          <CheckBox checked={booking.status === "confirmed"} large />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {booking.status === "confirmed" ? "Баталгаажсан" : "Баталгаажаагүй"}
            </span>
            <span className="block text-xs text-muted">
              {booking.status === "confirmed"
                ? "Өөр мастер руу шилжүүлж болно. Бусдыг засах бол check-ийг авна уу."
                : "Засах, өөр мастер руу шилжүүлэх, цуцлах боломжтой."}
            </span>
          </span>
        </button>
      )}

      {/* Төлбөр — урьдчилгаа төлсөн эсэх нэг мөрөөр */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl bg-primary-soft/50 px-4 py-3 text-sm">
        <span className="text-muted">
          Үнэ <b className="font-semibold text-foreground">{money(info.price)}</b>
        </span>
        <span className="text-muted">
          {booking.paid > 0 ? (
            <>
              Төлсөн <b className="text-emerald-700">{money(Math.min(booking.paid, info.price))}</b>
              {booking.paid < info.price && <span className="text-xs"> · QPay урьдчилгаа</span>}
            </>
          ) : (
            "Төлбөр төлөөгүй"
          )}
        </span>
        {balance > 0 && booking.status !== "cancelled" && (
          <span className="w-full text-xs text-muted">
            Үлдэгдэл {money(balance)} — үйлчилгээний дараа төлнө
          </span>
        )}
      </div>

      {editable ? (
        <EditForm
          key={`${booking.item}|${booking.staffId}|${booking.day}|${booking.start}|${booking.name}|${booking.phone}`}
          booking={booking}
          bookings={bookings}
          today={today}
          onSave={(patch) => {
            update(booking.id, patch);
            onSaved(patch.day ?? booking.day);
            notify("✓ Хадгалагдлаа");
          }}
        />
      ) : (
        <>
          <dl className="mt-5 space-y-2.5 text-sm">
            <Detail label={info.isPackage ? "Багц" : "Үйлчилгээ"} value={`${info.emoji} ${info.label}`} />
            <Detail label="Мастер" value={master} />
            <Detail
              label="Цаг"
              value={`${dayLabel(today, booking.day)} · ${hhmm(booking.start)}–${hhmm(booking.start + info.durationMin)}`}
            />
            {booking.note && <Detail label="Тэмдэглэл" value={booking.note} />}
          </dl>

          {booking.status === "confirmed" && !locked && (
            <MoveForm
              key={booking.staffId}
              booking={booking}
              bookings={bookings}
              onMove={(staffId) => {
                update(booking.id, { staffId });
                notify(`${booking.name} → ${staffName(staffId)} руу шилжлээ`);
              }}
            />
          )}
        </>
      )}

      {siblings.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-muted">👥 Хамт захиалсан — нэг үйлчлүүлэгч, өөр мастерууд зэрэг</p>
          <ul className="mt-1.5 space-y-1">
            {siblings.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpen(s)}
                  className="block w-full rounded-xl bg-surface-2/60 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary-soft"
                >
                  {itemInfo(s.item).label} · {staffName(s.staffId)} · {hhmm(s.start)}
                  {s.status === "cancelled" ? " (цуцлагдсан)" : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(editable || booking.status === "cancelled") && (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-4">
          {editable &&
            (confirmCancel ? (
              <>
                <span className="mr-auto text-sm text-muted">Цуцлах уу?</span>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="min-h-10 rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground"
                >
                  Үгүй
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update(booking.id, { status: "cancelled" });
                    notify("Захиалга цуцлагдлаа — үйлчлүүлэгчид мэдэгдэл очлоо");
                  }}
                  className="min-h-10 rounded-full bg-rose-600 px-4 text-sm font-medium text-white"
                >
                  Тийм, цуцлах
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="min-h-10 rounded-full px-4 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                Захиалга цуцлах
              </button>
            ))}
          {booking.status === "cancelled" && (
            <button
              type="button"
              onClick={() => {
                if (!isFree(bookings, booking.staffId, booking.day, booking.start, info.durationMin, booking.id)) {
                  notify("Энэ цагт мастер өөр захиалгатай болсон байна");
                  return;
                }
                update(booking.id, { status: "confirmed" });
                notify("✓ Захиалга сэргээгдлээ");
              }}
              className="min-h-10 rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            >
              Сэргээх
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** Сонгох өдрүүд: өнөөдрөөс 3 долоо хоног. */
function dayOptions(today: Date, current?: number) {
  const days = Array.from({ length: 21 }, (_, i) => i);
  if (current !== undefined && !days.includes(current)) days.unshift(current);
  return days.map((d) => ({ value: d, label: dayLabel(today, d) }));
}

function ItemOptions() {
  return (
    <>
      <optgroup label="Багц">
        {packages.map((p) => (
          <option key={p.id} value={`pkg:${p.id}`}>
            {p.emoji} {p.name} — {money(p.price)}
          </option>
        ))}
      </optgroup>
      <optgroup label="Үйлчилгээ">
        {services.map((s) => (
          <option key={s.id} value={`svc:${s.id}`}>
            {s.emoji} {s.name} — {money(s.price)} · {s.durationMin} мин
          </option>
        ))}
      </optgroup>
    </>
  );
}

/** Баталгаажаагүй захиалгыг засах — сул цаг л сонгогдоно, давхардахгүй. */
function EditForm({
  booking,
  bookings,
  today,
  onSave,
}: {
  booking: DemoBooking;
  bookings: DemoBooking[];
  today: Date;
  onSave: (patch: Partial<DemoBooking>) => void;
}) {
  const [item, setItem] = useState(booking.item);
  const [staffId, setStaffId] = useState(booking.staffId);
  const [day, setDay] = useState(booking.day);
  const [start, setStart] = useState(booking.start);
  const [name, setName] = useState(booking.name);
  const [phone, setPhone] = useState(booking.phone);
  const [note, setNote] = useState(booking.note ?? "");
  const locked = Boolean(booking.locked);

  const branchId = branchOf(booking.staffId);
  const options = staff.filter(
    (m) => m.branchId === branchId && (m.id === booking.staffId || canDo(m, item)),
  );
  const who = locked ? booking.staffId : options.some((m) => m.id === staffId) ? staffId : options[0]?.id;
  const slots = who ? freeSlots(bookings, who, day, itemInfo(item).durationMin, booking.id) : [];
  const time = slots.includes(start) ? start : slots[0];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!who || time === undefined) return;
        onSave({ item, staffId: who, day, start: time, name, phone, note: note || undefined });
      }}
      className="mt-5 grid gap-4 sm:grid-cols-2"
    >
      <Field label="Үйлчилгээ / багц" full>
        <select value={item} onChange={(e) => setItem(e.target.value)} className="field">
          <ItemOptions />
        </select>
      </Field>

      <Field label={locked ? "Мастер · ★ түгжээтэй" : "Мастер · өөр хүн рүү шилжүүлэх"} full>
        <select
          value={who ?? ""}
          onChange={(e) => setStaffId(e.target.value)}
          disabled={locked}
          className="field"
        >
          {options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.emoji} {m.name}
              {m.id === booking.staffId ? " (одоогийн)" : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Өдөр">
        <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="field">
          {dayOptions(today, booking.day).map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Цаг · зөвхөн сул цаг">
        <select
          value={time ?? ""}
          onChange={(e) => setStart(Number(e.target.value))}
          className="field"
        >
          {slots.length === 0 && <option value="">Сул цаг алга</option>}
          {slots.map((t) => (
            <option key={t} value={t}>
              {hhmm(t)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Нэр">
        <input value={name} onChange={(e) => setName(e.target.value)} required className="field" />
      </Field>
      <Field label="Утас">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          required
          className="field"
        />
      </Field>
      <Field label="Тэмдэглэл" full>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field resize-none" />
      </Field>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={time === undefined}
          className="min-h-11 w-full rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 sm:w-auto"
        >
          Хадгалах
        </button>
      </div>
    </form>
  );
}

/** Баталгаажсан захиалгыг өөр мастер руу — тэр цагт завтай нь л сонгогдоно. */
function MoveForm({
  booking,
  bookings,
  onMove,
}: {
  booking: DemoBooking;
  bookings: DemoBooking[];
  onMove: (staffId: string) => void;
}) {
  const [staffId, setStaffId] = useState("");
  const duration = itemInfo(booking.item).durationMin;
  const options = staff.filter(
    (m) => m.branchId === branchOf(booking.staffId) && m.id !== booking.staffId && canDo(m, booking.item),
  );
  if (options.length === 0) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (staffId) onMove(staffId);
      }}
      className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <label className="block min-w-0 flex-1">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Өөр мастер руу шилжүүлэх</span>
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="field">
          <option value="">— мастер сонгоно уу —</option>
          {options.map((m) => {
            const free = isFree(bookings, m.id, booking.day, booking.start, duration, booking.id);
            return (
              <option key={m.id} value={m.id} disabled={!free}>
                {m.emoji} {m.name}
                {free ? "" : " · завгүй"}
              </option>
            );
          })}
        </select>
      </label>
      <button
        type="submit"
        disabled={!staffId}
        className="min-h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        Шилжүүлэх
      </button>
    </form>
  );
}

/** Админ утсаар авсан захиалгаа гараар бүртгэнэ. */
function NewBookingSheet({
  bookings,
  branchId,
  initialDay,
  today,
  onClose,
  onAdd,
}: {
  bookings: DemoBooking[];
  branchId: string;
  initialDay: number;
  today: Date;
  onClose: () => void;
  onAdd: (b: Omit<DemoBooking, "id" | "code">) => void;
}) {
  const [item, setItem] = useState("svc:cut");
  const [staffId, setStaffId] = useState("");
  const [day, setDay] = useState(initialDay);
  const [start, setStart] = useState(-1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const branch = branches.find((b) => b.id === branchId) ?? branches[0];

  const options = staff.filter((m) => m.branchId === branchId && canDo(m, item));
  const who = options.some((m) => m.id === staffId) ? staffId : options[0]?.id;
  const slots = who ? freeSlots(bookings, who, day, itemInfo(item).durationMin) : [];
  const time = slots.includes(start) ? start : slots[0];

  return (
    <Sheet label="Шинэ захиалга" onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-foreground">Шинэ захиалга</h2>
          <p className="mt-0.5 text-sm text-muted">
            {branch.name} · утсаар авсан захиалгаа энд бүртгэнэ
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!who || time === undefined) return;
          onAdd({
            name: name.trim(),
            phone: phone.trim(),
            item,
            staffId: who,
            day,
            start: time,
            status: "confirmed",
            paid: 0,
            fresh: true,
          });
        }}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <Field label="Үйлчилгээ / багц" full>
          <select value={item} onChange={(e) => setItem(e.target.value)} className="field">
            <ItemOptions />
          </select>
        </Field>
        <Field label="Мастер" full>
          <select value={who ?? ""} onChange={(e) => setStaffId(e.target.value)} className="field">
            {options.length === 0 && <option value="">Энэ салбарт хийдэг мастер алга</option>}
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name} — {m.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Өдөр">
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="field">
            {dayOptions(today).map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Цаг · зөвхөн сул цаг">
          <select value={time ?? ""} onChange={(e) => setStart(Number(e.target.value))} className="field">
            {slots.length === 0 && <option value="">Сул цаг алга</option>}
            {slots.map((t) => (
              <option key={t} value={t}>
                {hhmm(t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Үйлчлүүлэгчийн нэр">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Б. Ариунаа"
            required
            className="field"
          />
        </Field>
        <Field label="Утас">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9911 2233"
            inputMode="tel"
            required
            className="field"
          />
        </Field>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={time === undefined}
            className="min-h-11 w-full rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 sm:w-auto"
          >
            Захиалга нэмэх
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-foreground">{value}</dd>
    </div>
  );
}
