"use client";

import { useMemo, useState } from "react";
import { bookingPrice, formatPrice } from "@/app/lib/format";
import type { Booking, Location, Service, ServicePackage, Staff } from "@/app/lib/types";

type Props = { bookings: Booking[]; services: Service[]; staff: Staff[]; packages: ServicePackage[]; locations: Location[]; today: string };
type RangeKey = "today" | "week" | "month" | "lastMonth" | "custom";
const MONTHS = ["1 сарын", "2 сарын", "3 сарын", "4 сарын", "5 сарын", "6 сарын", "7 сарын", "8 сарын", "9 сарын", "10 сарын", "11 сарын", "12 сарын"];
const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

function parseDate(value: string) { return new Date(`${value}T00:00:00`); }
function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function shiftDays(value: string, days: number) {
  const date = parseDate(value); date.setDate(date.getDate() + days); return isoDate(date);
}
function rangeFor(key: Exclude<RangeKey, "custom">, today: string) {
  const current = parseDate(today);
  if (key === "today") return { from: today, to: today };
  if (key === "week") return { from: shiftDays(today, -6), to: today };
  if (key === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  return {
    from: isoDate(new Date(current.getFullYear(), current.getMonth() - 1, 1)),
    to: isoDate(new Date(current.getFullYear(), current.getMonth(), 0)),
  };
}
function humanDate(value: string) {
  const date = parseDate(value); return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${WEEKDAYS[date.getDay()]}`;
}
function dateList(from: string, to: string) {
  const result: string[] = []; const cursor = parseDate(from); const end = parseDate(to);
  while (cursor <= end && result.length < 62) { result.push(isoDate(cursor)); cursor.setDate(cursor.getDate() + 1); }
  return result;
}

export default function DashboardReport({ bookings, services, staff, packages, locations, today }: Props) {
  const initial = rangeFor("month", today);
  const [range, setRange] = useState<RangeKey>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [locationId, setLocationId] = useState("all");
  const [breakdown, setBreakdown] = useState<"service" | "staff">("service");

  const selectRange = (key: Exclude<RangeKey, "custom">) => {
    const next = rangeFor(key, today); setRange(key); setFrom(next.from); setTo(next.to);
  };
  const report = useMemo(() => {
    const included = bookings.filter((booking) => booking.date >= from && booking.date <= to && (booking.status === "confirmed" || booking.status === "done") && (locationId === "all" || booking.locationId === locationId));
    const priceOf = (booking: Booking) => bookingPrice(booking, services, packages);
    const serviceRevenue = included.reduce((sum, booking) => sum + priceOf(booking), 0);
    const extraRevenue = included.reduce((sum, booking) => sum + booking.extraCharge, 0);
    const total = serviceRevenue + extraRevenue;
    const average = included.length ? Math.round(total / included.length) : 0;
    const days = dateList(from, to).map((date) => {
      const rows = included.filter((booking) => booking.date === date);
      return { date, service: rows.reduce((sum, booking) => sum + priceOf(booking), 0), extra: rows.reduce((sum, booking) => sum + booking.extraCharge, 0) };
    });
    const serviceRows = [
      ...services.map((service) => {
        const rows = included.filter((booking) => booking.serviceId === service.id);
        return { id: service.id, name: service.name, count: rows.length, amount: rows.reduce((sum, booking) => sum + priceOf(booking) + booking.extraCharge, 0) };
      }),
      ...packages.map((pkg) => {
        const rows = included.filter((booking) => booking.packageId === pkg.id);
        return { id: pkg.id, name: `${pkg.name} · багц`, count: rows.length, amount: rows.reduce((sum, booking) => sum + priceOf(booking) + booking.extraCharge, 0) };
      }),
    ].filter((row) => row.count > 0).sort((a, b) => b.amount - a.amount);
    const staffRows = staff.map((member) => {
      const rows = included.filter((booking) => booking.staffId === member.id);
      return { id: member.id, name: member.name, count: rows.length, amount: rows.reduce((sum, booking) => sum + priceOf(booking) + booking.extraCharge, 0) };
    }).filter((row) => row.count > 0).sort((a, b) => b.amount - a.amount);
    return { included, serviceRevenue, extraRevenue, total, average, days, serviceRows, staffRows };
  }, [bookings, from, locationId, packages, services, staff, to]);

  const maxDay = Math.max(1, ...report.days.map((day) => day.service + day.extra));
  const rows = breakdown === "service" ? report.serviceRows : report.staffRows;
  const maxRow = Math.max(1, ...rows.map((row) => row.amount));
  const locationName = locations.find((location) => location.id === locationId)?.name || "Бүх салбар";

  return (
    <div className="pb-10">
      <header className="border-b border-border/70 px-4 pb-5 pt-2 sm:px-0 sm:pb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Хянах самбар</h1>
        <p className="mt-1 text-sm text-muted">{locationName} · {humanDate(from)} – {humanDate(to)}</p>
      </header>

      <section className="sticky top-16 z-20 border-b border-border/70 bg-background/95 px-4 py-4 backdrop-blur sm:static sm:px-0">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="no-scrollbar flex w-full overflow-x-auto rounded-2xl bg-surface-2/80 p-1 xl:w-auto">
            {([["today", "Өнөөдөр"], ["week", "7 хоног"], ["month", "Энэ сар"], ["lastMonth", "Өнгөрсөн сар"]] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => selectRange(key)} className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-medium transition ${range === key ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}>{label}</button>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.15fr]">
            <DateField label="Эхлэх" value={from} onChange={(value) => { setFrom(value); setRange("custom"); }} />
            <DateField label="Дуусах" value={to} onChange={(value) => { setTo(value); setRange("custom"); }} />
            <label className="col-span-2 block sm:col-span-1">
              <span className="mb-1 block text-xs text-muted">Салбар</span>
              <select className="field bg-surface" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                <option value="all">Бүх салбар</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name || "Үндсэн салбар"}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="px-4 pt-5 sm:px-0 sm:pt-6">
        <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr]">
          <div className="relative min-h-44 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-soft via-surface-2/70 to-surface p-6 text-foreground shadow-sm sm:p-7">
            <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-primary/[0.045]" />
            <p className="relative text-sm text-muted">Нийт орлого</p>
            <p className="relative mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{formatPrice(report.total)}</p>
            <p className="relative mt-3 text-sm text-muted">{humanDate(from)} – {humanDate(to)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Үйлчилгээ" value={formatPrice(report.serviceRevenue)} />
            <Metric label="Нэмэлт төлбөр" value={formatPrice(report.extraRevenue)} />
            <Metric label="Захиалга" value={String(report.included.length)} />
            <Metric label="Дундаж дүн" value={formatPrice(report.average)} />
          </div>
        </div>
      </section>

      <section className="mt-7 px-4 sm:px-0">
        <div className="mb-3 flex items-baseline gap-2"><h2 className="font-display text-lg font-semibold">Өдрөөр</h2><span className="text-sm text-muted">{report.days.length} өдөр</span></div>
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/60 px-5 py-3 text-xs text-muted">
            <Legend color="#b76e79" label="Үйлчилгээ" /><Legend color="#ca8125" label="Нэмэлт төлбөр" />
            <span className="ml-auto">Дундаж {formatPrice(report.days.length ? Math.round(report.total / report.days.length) : 0)}</span>
          </div>
          {report.days.length ? (
            <div className="no-scrollbar overflow-x-auto px-4 pb-4 pt-5 sm:px-6">
              <div className="flex h-64 min-w-max items-end gap-3 border-b border-border sm:gap-4">
                {report.days.map((day) => {
                  const total = day.service + day.extra; const height = total ? Math.max(8, (total / maxDay) * 210) : 2; const extraHeight = total ? (day.extra / total) * height : 0;
                  return (
                    <div key={day.date} className="group flex h-full w-8 shrink-0 flex-col justify-end sm:w-10" title={`${day.date}: ${formatPrice(total)}`}>
                      <div className="relative w-full overflow-hidden rounded-t-md bg-surface-2 transition-opacity group-hover:opacity-80" style={{ height }}>
                        <div className="absolute inset-x-0 bottom-0 bg-primary" style={{ height: height - extraHeight }} />
                        {extraHeight > 0 && <div className="absolute inset-x-0 top-0 bg-[#ca8125]" style={{ height: extraHeight }} />}
                      </div>
                      <span className="mt-2 text-center text-[10px] text-muted">{Number(day.date.slice(8))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <EmptyState />}
        </div>
      </section>

      <section className="mt-7 px-4 sm:px-0">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-semibold">Задаргаа</h2>
          <div className="flex rounded-2xl bg-surface-2/80 p-1">
            <BreakdownButton active={breakdown === "service"} onClick={() => setBreakdown("service")}>Үйлчилгээгээр</BreakdownButton>
            <BreakdownButton active={breakdown === "staff"} onClick={() => setBreakdown("staff")}>Ажилтнаар</BreakdownButton>
          </div>
          <span className="text-sm text-muted">{rows.length} мөр · {formatPrice(report.total)}</span>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface">
          {rows.length ? rows.map((row, index) => (
            <div key={row.id} className={`px-4 py-3.5 sm:px-5 ${index ? "border-t border-border/45" : ""}`}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <p className="min-w-0 truncate text-foreground">{breakdown === "staff" && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#8b78aa]" />}{row.name} <span className="ml-1 text-xs text-muted">{row.count} захиалга</span></p>
                <p className="shrink-0 font-semibold tabular-nums">{formatPrice(row.amount)}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${(row.amount / maxRow) * 100}%` }} /></div>
            </div>
          )) : <EmptyState />}
        </div>
      </section>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs text-muted">{label}</span><input className="field bg-surface" type="date" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex min-h-20 flex-col justify-center rounded-2xl bg-primary-soft/60 px-4 py-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 truncate text-base font-semibold tabular-nums text-foreground sm:text-lg">{value}</p></div>;
}
function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{label}</span>;
}
function BreakdownButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`min-h-9 rounded-xl px-3 text-sm transition ${active ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted"}`}>{children}</button>;
}
function EmptyState() { return <p className="px-5 py-12 text-center text-sm text-muted">Сонгосон хугацаанд мэдээлэл алга байна.</p>; }
