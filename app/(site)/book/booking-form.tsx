"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Service, Staff } from "@/app/lib/types";
import { bookAction, getAvailableSlotsAction, type BookState } from "@/app/lib/actions";
import { formatDate, formatDuration, formatPrice } from "@/app/lib/format";

const STEPS = ["Үйлчилгээ", "Мастер", "Огноо & цаг", "Мэдээлэл"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function BookingForm({
  services,
  staff,
  initialServiceId,
  initialStaffId,
}: {
  services: Service[];
  staff: Staff[];
  initialServiceId?: string;
  initialStaffId?: string;
}) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [state, formAction, pending] = useActionState<BookState, FormData>(
    bookAction,
    { status: "idle" },
  );

  const service = services.find((s) => s.id === serviceId);
  const availableStaff = useMemo(
    () =>
      staff.filter(
        (m) => m.serviceIds.length === 0 || !serviceId || m.serviceIds.includes(serviceId),
      ),
    [staff, serviceId],
  );
  const selectedStaff = staff.find((s) => s.id === staffId);

  // If arriving with a prefilled service/staff, skip ahead to the right step.
  useEffect(() => {
    if (initialServiceId && initialStaffId) setStep(2);
    else if (initialServiceId || initialStaffId) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load available slots whenever service, staff or date changes.
  useEffect(() => {
    if (!serviceId || !staffId || !date) {
      setSlots([]);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    getAvailableSlotsAction(serviceId, staffId, date)
      .then((s) => {
        if (active) setSlots(s);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [serviceId, staffId, date]);

  // Reset time if it is no longer available.
  useEffect(() => {
    if (time && !slots.includes(time)) setTime("");
  }, [slots, time]);

  const canNext =
    (step === 0 && !!serviceId) ||
    (step === 1 && !!staffId) ||
    (step === 2 && !!date && !!time) ||
    step === 3;

  if (state.status === "success") {
    return (
      <div className="mt-10 rounded-3xl border border-border bg-surface p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-3xl">
          ✓
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
          Захиалга амжилттай!
        </h2>
        <p className="mt-2 text-muted">
          Таны захиалгыг хүлээн авлаа. Бид тантай удахгүй холбогдож баталгаажуулна.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-surface-2 p-5 text-left text-sm">
          <Row label="Үйлчилгээ" value={state.summary.service} />
          <Row label="Мастер" value={state.summary.staff} />
          <Row label="Огноо" value={formatDate(state.summary.date)} />
          <Row label="Цаг" value={state.summary.time} />
        </div>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* Stepper */}
      <ol className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  i < step
                    ? "border-primary bg-primary text-white"
                    : i === step
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-surface text-muted"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1.5 hidden text-xs sm:block ${
                  i <= step ? "text-foreground" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        {/* Step 1: service */}
        {step === 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Үйлчилгээ сонгох
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setServiceId(s.id);
                    // Clear staff if they can't perform the newly chosen service.
                    if (staffId) {
                      const m = staff.find((x) => x.id === staffId);
                      if (m && m.serviceIds.length > 0 && !m.serviceIds.includes(s.id)) {
                        setStaffId("");
                      }
                    }
                  }}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    serviceId === s.id
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:border-ring"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-xl">
                    {s.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{s.name}</span>
                    <span className="block text-xs text-muted">
                      {formatPrice(s.price)} · {formatDuration(s.durationMin)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: staff */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Мастер сонгох
            </h2>
            {availableStaff.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Энэ үйлчилгээнд боломжтой мастер алга байна.
              </p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {availableStaff.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setStaffId(m.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      staffId === m.id
                        ? "border-primary bg-primary-soft"
                        : "border-border hover:border-ring"
                    }`}
                  >
                    {m.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.imageUrl}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-soft to-surface-2 text-xl">
                        {m.emoji}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{m.name}</span>
                      <span className="block truncate text-xs text-muted">{m.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: date & time */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Огноо ба цаг сонгох
            </h2>
            <label className="mt-5 block text-sm font-medium text-foreground">Огноо</label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
            <p className="mt-5 text-sm font-medium text-foreground">Боломжит цаг</p>
            {loadingSlots ? (
              <p className="mt-3 text-sm text-muted">Ачааллаж байна…</p>
            ) : slots.length === 0 ? (
              <p className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
                Энэ өдөр боломжит цаг алга байна. Өөр өдөр сонгоно уу.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`rounded-xl border px-2 py-2.5 text-sm transition-colors ${
                      time === slot
                        ? "border-primary bg-primary text-white"
                        : "border-border text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: contact + confirm */}
        {step === 3 && (
          <form action={formAction}>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Холбоо барих мэдээлэл
            </h2>

            <input type="hidden" name="serviceId" value={serviceId} />
            <input type="hidden" name="staffId" value={staffId} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="time" value={time} />

            <div className="mt-5 space-y-4">
              <Field label="Таны нэр *">
                <input
                  name="customerName"
                  required
                  placeholder="Нэрээ оруулна уу"
                  className="input"
                />
              </Field>
              <Field label="Утасны дугаар *">
                <input
                  name="customerPhone"
                  required
                  inputMode="tel"
                  placeholder="9900-0000"
                  className="input"
                />
              </Field>
              <Field label="Нэмэлт тэмдэглэл">
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Хүсэлт, тодруулга байвал бичнэ үү"
                  className="input resize-none"
                />
              </Field>
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-2xl bg-surface-2 p-5 text-sm">
              <Row label="Үйлчилгээ" value={service?.name ?? "—"} />
              <Row label="Мастер" value={selectedStaff?.name ?? "—"} />
              <Row label="Огноо" value={formatDate(date)} />
              <Row label="Цаг" value={time || "—"} />
              {service && (
                <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium text-foreground">
                  <span>Нийт төлбөр</span>
                  <span>{formatPrice(service.price)}</span>
                </div>
              )}
            </div>

            {state.status === "error" && (
              <p className="mt-4 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-hover">
                {state.message}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-ring"
              >
                ← Буцах
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {pending ? "Илгээж байна…" : "Захиалга баталгаажуулах"}
              </button>
            </div>
          </form>
        )}

        {/* Nav (steps 1–3) */}
        {step < 3 && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-ring disabled:opacity-40"
            >
              ← Буцах
            </button>
            <button
              type="button"
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              Үргэлжлүүлэх →
            </button>
          </div>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--surface);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(217, 167, 173, 0.35);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
