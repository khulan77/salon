"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MyBooking } from "@/app/lib/types";
import {
  cancelMyBookingAction,
  findMyBookingAction,
  listMyBookingsAction,
} from "@/app/lib/actions";
import { StatusBadge } from "@/app/components/status-badge";
import { formatDate, formatDuration, formatPrice } from "@/app/lib/format";
import {
  forgetEntry,
  readEntries,
  rememberEntry,
  type MyBookingEntry,
} from "@/app/lib/my-bookings-store";

export default function MyBookings() {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyCode, setBusyCode] = useState("");
  const entries = useRef<MyBookingEntry[]>([]);

  // Энэ төхөөрөмжид хадгалсан захиалгуудыг ачаална.
  useEffect(() => {
    const saved = readEntries();
    entries.current = saved;
    Promise.resolve(saved.length ? listMyBookingsAction(saved) : [])
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  function forget(code: string) {
    entries.current = forgetEntry(code);
    setBookings((list) => list.filter((b) => b.code !== code));
  }

  async function handleSearch(formData: FormData) {
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const phone = String(formData.get("phone") ?? "").trim();
    setMessage("");

    if (!code || !phone) {
      setMessage("Код болон утасны дугаараа оруулна уу.");
      return;
    }

    const found = await findMyBookingAction(code, phone);
    if (!found) {
      setMessage("Захиалга олдсонгүй. Код болон утасны дугаараа шалгана уу.");
      return;
    }
    entries.current = rememberEntry({ code, phone });
    setBookings((list) => [found, ...list.filter((b) => b.code !== found.code)]);
  }

  async function handleCancel(code: string) {
    const entry = entries.current.find((e) => e.code === code);
    if (!entry) return;
    if (!confirm("Энэ захиалгыг цуцлах уу? Буцаах боломжгүй.")) return;

    setBusyCode(code);
    const result = await cancelMyBookingAction(entry.code, entry.phone);
    setMessage(result.message);
    if (result.ok) {
      const refreshed = await listMyBookingsAction(entries.current);
      setBookings(refreshed);
    }
    setBusyCode("");
  }

  return (
    <div className="mt-8">
      {/* Хайх маягт */}
      <form action={handleSearch} className="card p-6 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Захиалгын код
            </span>
            <input
              name="code"
              required
              maxLength={6}
              placeholder="K7F2QX"
              className="w-full rounded-xl bg-surface-2/60 px-3.5 py-2.5 text-sm uppercase tracking-[0.2em] outline-none focus:ring-2 focus:ring-ring/60"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Утасны дугаар
            </span>
            <input
              name="phone"
              required
              inputMode="tel"
              placeholder="9911-2233"
              className="w-full rounded-xl bg-surface-2/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/60"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Захиалга хайх
        </button>
      </form>

      {message && (
        <p className="mt-4 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-hover">
          {message}
        </p>
      )}

      {/* Захиалгууд */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Ачаалж байна…</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl bg-surface-2/50 p-10 text-center">
            <p className="text-muted">
              Энэ төхөөрөмж дээр хадгалагдсан захиалга алга байна.
            </p>
            <Link
              href="/book"
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Цаг захиалах
            </Link>
          </div>
        ) : (
          bookings.map((b) => (
            <BookingCard
              key={b.code}
              booking={b}
              busy={busyCode === b.code}
              onCancel={() => handleCancel(b.code)}
              onForget={() => forget(b.code)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  busy,
  onCancel,
  onForget,
}: {
  booking: MyBooking;
  busy: boolean;
  onCancel: () => void;
  onForget: () => void;
}) {
  const past = booking.status === "cancelled" || booking.status === "done" ||
    booking.status === "no_show";

  return (
    <div className={`card p-6 sm:p-7 ${past ? "opacity-75" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-2xl">
            {booking.serviceEmoji}
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {booking.serviceName}
            </h3>
            <p className="text-sm text-muted">Мастер: {booking.staffName}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <Row label="Огноо" value={formatDate(booking.date)} />
        <Row label="Цаг" value={`${booking.time} · ${formatDuration(booking.durationMin)}`} />
        <Row label="Төлбөр" value={formatPrice(booking.price)} />
        <Row label="Код" value={booking.code} mono />
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {booking.cancellable ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full bg-rose-50 px-5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
          >
            {busy ? "Цуцалж байна…" : "Захиалга цуцлах"}
          </button>
        ) : (
          !past && (
            <p className="text-xs text-muted">
              Цаг дөхсөн тул онлайнаар цуцлах боломжгүй — утсаар холбогдоно уу.
            </p>
          )
        )}
        <button
          type="button"
          onClick={onForget}
          className="rounded-full px-4 py-2 text-xs text-muted hover:text-foreground"
        >
          Жагсаалтаас хасах
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 sm:block">
      <dt className="text-muted sm:text-xs">{label}</dt>
      <dd
        className={`font-medium text-foreground sm:mt-0.5 ${
          mono ? "font-mono tracking-[0.2em]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
