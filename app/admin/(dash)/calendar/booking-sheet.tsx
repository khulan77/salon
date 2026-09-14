"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Booking, Service, ServicePackage, Staff } from "@/app/lib/types";
import {
  adminMoveBookingAction,
  adminUpdateBookingAction,
  setBookingStatusAction,
  type EditBookingState,
} from "@/app/lib/actions";
import { effectivePrice, formatDate, formatDuration, formatPrice } from "@/app/lib/format";
import { StatusBadge } from "@/app/components/status-badge";
import ConfirmForm from "../confirm-form";
import ConfirmCheck from "./confirm-check";
import StarToggle from "./star-toggle";

/*
  Хуанлийн блок дээр дарахад гарах захиалгын хуудас (утсан дээр доороос
  гарч ирнэ, том дэлгэцэд голд).

  Check-тэй (баталгаажсан) захиалгыг зөвхөн өөр мастер руу шилжүүлж болно.
  Check-ийг авбал засах маягт нээгдэж үйлчилгээ, мастер, огноо, цаг,
  үйлчлүүлэгчийн мэдээллийг засах, эсвэл цуцлах боломжтой.

  Нэрний өмнөх ⭐ — "зөвхөн энэ мастер дээр" гэсэн үйлчлүүлэгч. Одтой бол
  мастерыг солихгүй (check-тэй, check-гүй аль алинд).
*/

export type SheetSibling = { id: string; label: string; href: string };

export default function BookingSheet({
  booking,
  itemLabel,
  price,
  endTime,
  staffName,
  services,
  packages,
  staff,
  siblings,
  closeHref,
}: {
  booking: Booking;
  itemLabel: string;
  price: number;
  endTime: string;
  staffName: string;
  services: Service[];
  packages: ServicePackage[];
  /** Шилжүүлж болох мастерууд (энэ салбарынх). */
  staff: Staff[];
  /** Хамт захиалсан бусад үйлчилгээнүүд. */
  siblings: SheetSibling[];
  closeHref: string;
}) {
  const router = useRouter();
  const [state, formAction, saving] = useActionState<EditBookingState, FormData>(
    adminUpdateBookingAction,
    { status: "idle" },
  );
  const [moveState, moveAction, moving] = useActionState<EditBookingState, FormData>(
    adminMoveBookingAction,
    { status: "idle" },
  );

  // Esc дарахад хаана, нээлттэй үед ард нь байгаа хуудас гүйлгэгдэхгүй.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [router, closeHref]);

  const editable = booking.status === "pending";
  const checkable = booking.status === "pending" || booking.status === "confirmed";
  const locked = Boolean(booking.staffLocked);
  // Сүүлд илгээсэн маягтын хариуг харуулна.
  const shown = booking.status === "confirmed" ? moveState : state;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <Link
        href={closeHref}
        scroll={false}
        aria-label="Хаах"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${booking.customerName} — захиалга`}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
              {checkable && <StarToggle id={booking.id} locked={locked} />}
              <h2 className="truncate font-display text-xl font-semibold text-foreground">
                {booking.customerName}
              </h2>
              {!checkable && <StatusBadge status={booking.status} />}
            </div>
            {locked && (
              <p className="mt-0.5 text-xs text-amber-700">
                ★ Тогтмол мастер: {staffName} — өөр мастер руу шилжүүлэхгүй.
              </p>
            )}
            <p className="mt-0.5 text-sm text-muted">
              <a href={`tel:${booking.customerPhone}`} className="text-primary hover:underline">
                📞 {booking.customerPhone}
              </a>
              {booking.code && (
                <span className="ml-2 font-mono text-xs tracking-[0.15em]">{booking.code}</span>
              )}
            </p>
          </div>
          <Link
            href={closeHref}
            scroll={false}
            aria-label="Хаах"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg text-muted transition-colors hover:text-foreground"
          >
            ×
          </Link>
        </div>

        {checkable && (
          <div className="mt-4">
            <ConfirmCheck
              id={booking.id}
              confirmed={booking.status === "confirmed"}
              size="lg"
            />
          </div>
        )}

        {shown.status === "success" && checkable && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
            ✓ Хадгалагдлаа
          </p>
        )}
        {shown.status === "error" && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {shown.message}
          </p>
        )}

        {editable ? (
          <EditForm
            // Хадгалсны дараа шинэ утгаар дахин эхэлнэ (defaultValue шинэчлэгдэнэ).
            key={`${booking.serviceId}|${booking.packageId}|${booking.staffId}|${booking.date}|${booking.time}|${booking.customerName}|${booking.customerPhone}|${booking.note}`}
            booking={booking}
            services={services}
            packages={packages}
            staff={staff}
            formAction={formAction}
            saving={saving}
            locked={locked}
          />
        ) : (
          <>
            <dl className="mt-5 space-y-2.5 text-sm">
              <Detail label={booking.packageId ? "Багц" : "Үйлчилгээ"} value={itemLabel} />
              <Detail label="Мастер" value={staffName} />
              <Detail
                label="Цаг"
                value={`${formatDate(booking.date)} · ${booking.time}–${endTime}`}
              />
              {price > 0 && <Detail label="Үнэ" value={formatPrice(price)} />}
              {booking.note && <Detail label="Тэмдэглэл" value={booking.note} />}
            </dl>

            {/* Баталгаажсан ч өөр мастер руу шилжүүлж болно (одгүй бол). */}
            {booking.status === "confirmed" && !locked && (
              <MoveForm
                key={booking.staffId}
                booking={booking}
                staff={staff}
                formAction={moveAction}
                moving={moving}
              />
            )}
          </>
        )}

        {siblings.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-muted">👥 Хамт захиалсан</p>
            <ul className="mt-1.5 space-y-1">
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.href}
                    scroll={false}
                    className="block rounded-xl bg-surface-2/60 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-soft"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Link
            href={`/admin/bookings?q=${booking.code}`}
            className="text-sm text-muted transition-colors hover:text-primary"
          >
            Төлбөр, дэлгэрэнгүй →
          </Link>

          {editable && (
            <ConfirmForm
              action={setBookingStatusAction}
              message={`${booking.customerName} — ${formatDate(booking.date)} ${booking.time} захиалгыг цуцлах уу?`}
            >
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="status" value="cancelled" />
              <button
                type="submit"
                className="min-h-10 rounded-full px-4 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                Захиалга цуцлах
              </button>
            </ConfirmForm>
          )}
          {booking.status === "cancelled" && (
            <form action={setBookingStatusAction}>
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="status" value="confirmed" />
              <button
                type="submit"
                className="min-h-10 rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                Сэргээх
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/** Баталгаажаагүй захиалгыг засах маягт. */
function EditForm({
  booking,
  services,
  packages,
  staff,
  formAction,
  saving,
  locked,
}: {
  booking: Booking;
  services: Service[];
  packages: ServicePackage[];
  staff: Staff[];
  formAction: (formData: FormData) => void;
  saving: boolean;
  /** ⭐ — мастерыг солихгүй. */
  locked: boolean;
}) {
  const [item, setItem] = useState(
    booking.packageId ? `pkg:${booking.packageId}` : `svc:${booking.serviceId}`,
  );
  const [staffId, setStaffId] = useState(booking.staffId);
  const serviceId = item.startsWith("svc:") ? item.slice(4) : "";

  // Сонгосон үйлчилгээг хийдэг мастерууд. Одоогийн мастер жагсаалтад байхгүй
  // (өөр салбар г.м) бол ч харагдах ёстой — эс тэгвэл сонголт хоосорно.
  const options = staff.filter(
    (m) =>
      m.id === booking.staffId ||
      !serviceId ||
      m.serviceIds.length === 0 ||
      m.serviceIds.includes(serviceId),
  );
  const staffOk = options.some((m) => m.id === staffId);

  return (
    <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={booking.id} />

      <Field label="Үйлчилгээ / багц" full>
        <select
          name="item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="field"
        >
          {packages.length > 0 && (
            <optgroup label="Багц">
              {packages.map((p) => (
                <option key={p.id} value={`pkg:${p.id}`}>
                  {p.emoji} {p.name} — {formatPrice(p.price)}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Үйлчилгээ">
            {services.map((s) => (
              <option key={s.id} value={`svc:${s.id}`}>
                {s.emoji} {s.name} — {formatPrice(effectivePrice(s))} ·{" "}
                {formatDuration(s.durationMin)}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>

      <Field label={locked ? "Мастер · ⭐ түгжээтэй" : "Мастер · өөр хүн рүү шилжүүлэх"} full>
        {/* Идэвхгүй select утгаа илгээдэггүй тул одтой үед нууц талбараар. */}
        {locked && <input type="hidden" name="staffId" value={booking.staffId} />}
        <select
          name={locked ? undefined : "staffId"}
          value={locked ? booking.staffId : staffOk ? staffId : ""}
          onChange={(e) => setStaffId(e.target.value)}
          disabled={locked}
          className="field"
        >
          {!staffOk && <option value="">— мастер сонгоно уу —</option>}
          {options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.emoji} {m.name}
              {m.id === booking.staffId ? " (одоогийн)" : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Огноо">
        <input type="date" name="date" defaultValue={booking.date} required className="field" />
      </Field>
      <Field label="Цаг">
        <input
          type="time"
          name="time"
          step={300}
          defaultValue={booking.time}
          required
          className="field"
        />
      </Field>

      <Field label="Нэр">
        <input
          name="customerName"
          defaultValue={booking.customerName}
          required
          className="field"
        />
      </Field>
      <Field label="Утас">
        <input
          name="customerPhone"
          defaultValue={booking.customerPhone}
          inputMode="tel"
          required
          className="field"
        />
      </Field>

      <Field label="Тэмдэглэл" full>
        <textarea
          name="note"
          rows={2}
          defaultValue={booking.note}
          className="field resize-none"
        />
      </Field>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 w-full rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
    </form>
  );
}

/** Баталгаажсан захиалгыг өөр мастер руу шилжүүлэх — зөвхөн мастер солигдоно. */
function MoveForm({
  booking,
  staff,
  formAction,
  moving,
}: {
  booking: Booking;
  staff: Staff[];
  formAction: (formData: FormData) => void;
  moving: boolean;
}) {
  const [staffId, setStaffId] = useState("");
  // Энэ үйлчилгээг хийдэг бусад мастерууд (багц бол бүгд).
  const options = staff.filter(
    (m) =>
      m.id !== booking.staffId &&
      (booking.packageId ||
        m.serviceIds.length === 0 ||
        m.serviceIds.includes(booking.serviceId)),
  );
  if (options.length === 0) return null;

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={booking.id} />
      <label className="block min-w-0 flex-1">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Өөр мастер руу шилжүүлэх
        </span>
        <select
          name="staffId"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="field"
        >
          <option value="">— мастер сонгоно уу —</option>
          {options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.emoji} {m.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={!staffId || moving}
        className="min-h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {moving ? "Шилжүүлж байна…" : "Шилжүүлэх"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
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
