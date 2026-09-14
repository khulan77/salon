import Link from "next/link";
import {
  getBooking,
  getBookingGroup,
  getLocations,
  getPackages,
  getServices,
  getSettings,
  getStaff,
  searchBookings,
} from "@/app/lib/db";
import { bookingPrice, packageTotals } from "@/app/lib/format";
import { salonNowMinutes, salonToday } from "@/app/lib/time";
import NewBooking from "../bookings/new-booking";
import DayGrid, {
  toMinutes,
  type CalBooking,
  type Column,
} from "./day-grid";
import RangeGrid, { type DayCell } from "./range-grid";
import BookingSheet from "./booking-sheet";

export const metadata = { title: "Хуанли" };

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

/** "2026-09-01" дээр хоног нэмнэ/хасна. Календарийн огноо тул UTC-ээр тоолно. */
function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/** 690 -> "11:30" */
function minutesLabel(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; loc?: string; view?: string; edit?: string }>;
}) {
  const sp = await searchParams;
  const today = salonToday();
  // Буруу огноо ирвэл өнөөдөр рүү унана — хуанли хоосон цагаан болохгүй.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : today;

  // Харагдац: нэг өдрийн дэлгэрэнгүй тор, эсвэл 15/30 хоногийн тойм.
  const VIEWS = [
    { key: "day", label: "Өдөр", days: 1 },
    { key: "15", label: "15 хоног", days: 15 },
    { key: "30", label: "30 хоног", days: 30 },
  ] as const;
  const view = VIEWS.find((v) => v.key === sp.view) ?? VIEWS[0];
  const lastDate = shiftDay(date, view.days - 1);

  const [settings, locations, staff, services, packages, { rows }] = await Promise.all([
    getSettings(),
    getLocations({ activeOnly: true }),
    getStaff({ activeOnly: true }),
    getServices(),
    getPackages(),
    searchBookings({ from: date, to: lastDate, order: "asc" }),
  ]);

  const multiBranch = locations.length > 1;
  const location =
    locations.find((l) => l.id === sp.loc) ?? (multiBranch ? locations[0] : undefined);

  // Ажлын цаг: салбарынх давуу, байхгүй бол ерөнхий тохиргоо.
  const source = location ?? settings;
  const openMin = toMinutes(source.openTime || "10:00");
  const closeMin = Math.max(openMin + 60, toMinutes(source.closeTime || "20:00"));
  const closed = (source.closedDays ?? []).includes(weekdayOf(date));

  // Салбаргүй (хөвөгч) мастер бүх салбарт харагдана.
  const columnsStaff = staff.filter(
    (m) => !location || !m.locationId || m.locationId === location.id,
  );

  const active = rows.filter((b) => b.status !== "cancelled");
  const cancelled = rows.length - active.length;
  const staffIds = new Set(columnsStaff.map((m) => m.id));
  // Зөвхөн энэ салбарын мастеруудын захиалга.
  const mine = active.filter((b) => staffIds.has(b.staffId));

  /** Захиалга хэдэн минут үргэлжлэх вэ (багц бол дотоод үйлчилгээнүүдийн нийлбэр). */
  const minutesOf = (b: (typeof rows)[number]): number => {
    const pkg = b.packageId ? packages.find((p) => p.id === b.packageId) : undefined;
    const svc = services.find((s) => s.id === b.serviceId);
    return Math.max(
      15,
      pkg ? packageTotals(pkg, services).durationMin : (svc?.durationMin ?? 30),
    );
  };

  const dayBookings = mine.filter((b) => b.date === date);

  /** Захиалгыг хуанлийн блок болгоно (хугацаа, нэр, үнэ, төлөгдсөн дүн). */
  const toBlock = (b: (typeof rows)[number]): CalBooking => {
    const pkg = b.packageId ? packages.find((p) => p.id === b.packageId) : undefined;
    const svc = services.find((s) => s.id === b.serviceId);
    return {
      booking: b,
      startMin: toMinutes(b.time),
      durationMin: minutesOf(b),
      itemLabel: pkg ? `${pkg.name} (багц)` : (svc?.name ?? "—"),
      // Нэмэлт төлбөрийг үнэн дээр нэмнэ — доод мөрний нийлбэр бодит болно.
      price: bookingPrice(b, services, packages) + b.extraCharge,
      paid: b.depositPaid,
    };
  };

  const columns: Column[] = columnsStaff.map((m) => ({
    staff: m,
    bookings: dayBookings.filter((b) => b.staffId === m.id).map(toBlock),
  }));

  // Цуцлагдсаныг тор дээр биш, доор нь түүх болгож харуулна.
  const cancelledToday = rows
    .filter(
      (b) => b.date === date && b.status === "cancelled" && staffIds.has(b.staffId),
    )
    .map(toBlock);

  // Хугацааны нүднүүд — 15/30 хоногийн тоймд ашиглана. Нэг өдрийн харагдацад
  // ч мөн эхний нүд нь тухайн өдрийн ачааллыг өгнө.
  const dailyCapacity = columns.length * (closeMin - openMin);
  const cells: DayCell[] = Array.from({ length: view.days }, (_, i) => {
    const d = shiftDay(date, i);
    const dayClosed = (source.closedDays ?? []).includes(weekdayOf(d));
    const list = mine.filter((b) => b.date === d);
    const booked = list.reduce((sum, b) => sum + minutesOf(b), 0);
    return {
      date: d,
      weekday: WEEKDAYS[weekdayOf(d)].slice(0, 2),
      count: list.length,
      loadPercent:
        dayClosed || dailyCapacity === 0 ? 0 : Math.round((booked / dailyCapacity) * 100),
      closed: dayClosed,
      isToday: d === today,
      isPast: d < today,
    };
  });

  // Ачаалал — захиалсан минут / нийт боломжит минут. Тоймд амарсан өдрийг
  // багтаахгүй, эс тэгвэл ачаалал хиймлээр буурч харагдана.
  const workingDays = cells.filter((c) => !c.closed).length;
  const bookedMin = mine.reduce((sum, b) => sum + minutesOf(b), 0);
  const capacityMin = dailyCapacity * Math.max(workingDays, 0);
  const loadPercent = capacityMin > 0 ? Math.round((bookedMin / capacityMin) * 100) : 0;
  const freeHours = Math.max(0, Math.round((capacityMin - bookedMin) / 60));

  /** Хуанлийн холбоос. `edit` өгөөгүй бол нээлттэй захиалгын хуудас хаагдана. */
  const link = (next: { date?: string; loc?: string; view?: string; edit?: string }) => {
    const q = new URLSearchParams();
    const d = next.date ?? date;
    if (d !== today) q.set("date", d);
    const l = next.loc ?? location?.id;
    if (l && multiBranch) q.set("loc", l);
    const v = next.view ?? view.key;
    if (v !== "day") q.set("view", v);
    if (next.edit) q.set("edit", next.edit);
    const s = q.toString();
    return s ? `/admin/calendar?${s}` : "/admin/calendar";
  };

  // Блок дээр дарж нээсэн захиалга. Засаад өөр өдөр рүү шилжүүлсэн бол энэ
  // өдрийн жагсаалтад байхгүй тул тусад нь уншина — хуудас хаагдчихгүй.
  const editing = sp.edit
    ? (rows.find((b) => b.id === sp.edit) ?? (await getBooking(sp.edit)))
    : undefined;
  const staffNameOf = (id: string) => staff.find((m) => m.id === id)?.name ?? "—";
  const siblings =
    editing?.groupId
      ? (await getBookingGroup(editing.groupId))
          .filter((b) => b.id !== editing.id)
          .map((b) => {
            const block = toBlock(b);
            return {
              id: b.id,
              label: `${block.itemLabel} · ${staffNameOf(b.staffId)} · ${b.time}${
                b.status === "cancelled" ? " (цуцлагдсан)" : ""
              }`,
              href: link({ date: b.date, edit: b.id }),
            };
          })
      : [];

  // Долоо хоногийн зурвас — өчигдрөөс эхлээд 7 хоног.
  const strip = Array.from({ length: 7 }, (_, i) => shiftDay(date, i - 1));

  const stats = [
    { label: "Захиалга", value: String(mine.length) },
    { label: "Ажиллах мастер", value: String(columns.length) },
    { label: "Ачаалал", value: `${loadPercent}%` },
    { label: "Чөлөөт цаг", value: `${freeHours} ц` },
    { label: "Цуцлагдсан", value: String(cancelled) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={link({ date: today })}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              date === today
                ? "bg-foreground text-background"
                : "bg-surface-2 text-foreground hover:bg-primary-soft"
            }`}
          >
            Өнөөдөр
          </Link>
          <Link
            href={link({ date: shiftDay(date, -view.days) })}
            aria-label="Өмнөх"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:text-primary"
          >
            ‹
          </Link>
          <h1 className="min-w-0 font-display text-lg font-semibold text-foreground sm:text-2xl">
            {date.slice(8)} / {date.slice(5, 7)} / {date.slice(0, 4)}{" "}
            <span className="text-muted">
              {view.key === "day"
                ? WEEKDAYS[weekdayOf(date)]
                : `— ${lastDate.slice(8)} / ${lastDate.slice(5, 7)}`}
            </span>
          </h1>
          <Link
            href={link({ date: shiftDay(date, view.days) })}
            aria-label="Дараах"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:text-primary"
          >
            ›
          </Link>
        </div>

        {/* Захиалга нэмэх маягтыг захиалгын хуудастай хуваалцана — харж буй
            өдөр, салбарыг урьдчилж бөглөнө. */}
        <NewBooking
          services={services}
          staff={staff}
          locations={locations}
          packages={packages}
          initialDate={date}
          initialLocationId={location?.id}
        />
      </div>

      {multiBranch && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {locations.map((l) => (
            <Link
              key={l.id}
              href={link({ loc: l.id })}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                location?.id === l.id
                  ? "bg-surface text-foreground shadow-sm"
                  : "bg-surface-2/70 text-muted hover:text-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  location?.id === l.id ? "bg-primary" : "bg-border"
                }`}
              />
              {l.name || l.address || "Салбар"}
            </Link>
          ))}
        </div>
      )}
      
      <div
        className={`no-scrollbar mt-3 gap-2 overflow-x-auto pb-1 ${
          view.key === "day" ? "flex" : "hidden"
        }`}
      >
        {strip.map((d) => {
          const on = d === date;
          return (
            <Link
              key={d}
              href={link({ date: d })}
              className={`flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 transition-colors ${
                on
                  ? "bg-primary text-white"
                  : "bg-surface-2/60 text-foreground hover:bg-primary-soft"
              }`}
            >
              <span className={`text-[10px] ${on ? "text-white/80" : "text-muted"}`}>
                {d === today ? "Өнөөдөр" : WEEKDAYS[weekdayOf(d)].slice(0, 2)}
              </span>
              <span className="text-base font-semibold tabular-nums">
                {Number(d.slice(8))}
              </span>
            </Link>
          );
        })}
      </div>

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
            <Link
              key={v.key}
              href={link({ view: v.key })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                view.key === v.key
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      {closed && view.key === "day" && (
        <p className="mt-4 rounded-2xl bg-surface-2/70 px-4 py-3 text-sm text-muted">
          🌙 Энэ өдөр амралтын өдөр гэж тохируулагдсан байна — онлайнаар захиалга
          орохгүй. Гараар бүртгэх бол «Хуваариас гадуур» сонголтыг ашиглана уу.
        </p>
      )}

      {columns.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-sm text-muted">
          {multiBranch
            ? "Энэ салбарт мастер бүртгэгдээгүй байна."
            : "Одоогоор мастер бүртгэгдээгүй байна."}
        </p>
      ) : view.key === "day" ? (
        <DayGrid
          columns={columns}
          cancelled={cancelledToday}
          openMin={openMin}
          closeMin={closeMin}
          stepMin={30}
          nowMin={date === today ? salonNowMinutes() : undefined}
          editHref={(id) => link({ edit: id })}
        />
      ) : (
        <>
          <RangeGrid cells={cells} hrefFor={(d) => link({ date: d, view: "day" })} />
          <p className="mt-4 text-xs text-muted">
            Өдөр дээр дарвал тухайн өдрийн дэлгэрэнгүй хуваарь нээгдэнэ.
          </p>
        </>
      )}

      {editing && (() => {
        const block = toBlock(editing);
        // Энэ салбарын мастерууд руу шилжүүлнэ; одоогийн мастер өөр салбарынх
        // байсан ч жагсаалтад үлдэнэ.
        const movable = staff.filter(
          (m) => columnsStaff.includes(m) || m.id === editing.staffId,
        );
        return (
          <BookingSheet
            booking={editing}
            itemLabel={block.itemLabel}
            price={block.price}
            endTime={minutesLabel(block.startMin + block.durationMin)}
            staffName={staffNameOf(editing.staffId)}
            services={services.filter((s) => s.active || s.id === editing.serviceId)}
            packages={packages.filter((p) => p.active || p.id === editing.packageId)}
            staff={movable}
            siblings={siblings}
            closeHref={link({})}
          />
        );
      })()}
    </div>
  );
}
