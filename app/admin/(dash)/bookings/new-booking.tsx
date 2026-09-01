"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { Location, Service, ServicePackage, Staff } from "@/app/lib/types";
import {
  adminCreateBookingAction,
  getAvailableSlotsAction,
  getPackageAvailableSlotsAction,
  type AdminBookState,
} from "@/app/lib/actions";
import { effectivePrice, formatDuration, formatPrice } from "@/app/lib/format";
import { salonToday } from "@/app/lib/time";

/**
 * Утсаар залгасан үйлчлүүлэгчийг админ өөрөө бүртгэх маягт. Үйлчлүүлэгчийн
 * хэсэгтэй ижил сул цагийн хөдөлгүүрийг ашиглана — ялгаа нь захиалгыг шууд
 * баталгаажуулах, шаардлагатай бол хуваариас гадуур цаг оруулах боломж.
 */
export default function NewBooking({
  services,
  staff,
  locations,
  packages,
  initialDate,
  initialLocationId,
}: {
  services: Service[];
  staff: Staff[];
  locations: Location[];
  packages: ServicePackage[];
  /** Хуанлиас дуудахад харж буй өдөр, салбарыг урьдчилж бөглөнө. */
  initialDate?: string;
  initialLocationId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AdminBookState, FormData>(
    adminCreateBookingAction,
    { status: "idle" },
  );

  const multiBranch = locations.length > 1;
  const [locationId, setLocationId] = useState(
    initialLocationId ?? locations[0]?.id ?? "",
  );
  // Үйлчилгээ, багцыг нэг сонгогчид нэгтгэв: "svc:<id>" эсвэл "pkg:<id>".
  const [item, setItem] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(initialDate ?? salonToday());
  const [time, setTime] = useState("");
  const [freeTime, setFreeTime] = useState(false);

  const serviceId = item.startsWith("svc:") ? item.slice(4) : "";
  const packageId = item.startsWith("pkg:") ? item.slice(4) : "";

  // Салбар болон сонгосон үйлчилгээнд тохирох мастерууд. Багц сонгосон үед
  // салбарын бүх мастер боломжтой; салбаргүй мастер бүх салбарт үзэгдэнэ.
  const availableStaff = useMemo(
    () =>
      staff.filter((m) => {
        const okBranch = !multiBranch || !m.locationId || m.locationId === locationId;
        const okService =
          !!packageId ||
          !serviceId ||
          m.serviceIds.length === 0 ||
          m.serviceIds.includes(serviceId);
        return okBranch && okService;
      }),
    [staff, serviceId, packageId, locationId, multiBranch],
  );

  // Сул цагийг сонголт бүрд шинэчилнэ. Хариуг түлхүүртэй нь хамт хадгалснаар
  // "ачаалж байна" төлөвийг тооцоолж гаргана — effect дотор setState хийхгүй.
  const key = `${serviceId}|${packageId}|${staffId}|${date}|${locationId}`;
  const ready = Boolean((serviceId || packageId) && staffId && date);
  const [loaded, setLoaded] = useState<{ key: string; slots: string[] }>({
    key: "",
    slots: [],
  });

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const req = packageId
      ? getPackageAvailableSlotsAction(packageId, staffId, date, locationId)
      : getAvailableSlotsAction(serviceId, staffId, date, locationId);
    req.then((slots) => {
      if (active) setLoaded({ key, slots });
    });
    return () => {
      active = false;
    };
  }, [key, ready, serviceId, packageId, staffId, date, locationId]);

  const fresh = loaded.key === key;
  const slots = fresh ? loaded.slots : [];
  const loadingSlots = ready && !fresh;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
      >
        + Захиалга нэмэх
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Утсаар ирсэн захиалга бүртгэх
          </h2>
          <p className="mt-1 text-sm text-muted">
            Бүртгэсний дараа гарах кодыг үйлчлүүлэгчид уншиж өгнө үү — тэр кодоор
            захиалгаа хянах, цуцлах боломжтой.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-ring"
        >
          Хаах
        </button>
      </div>

      {state.status === "success" && (
        <div className="mt-5 rounded-2xl bg-primary-soft/60 p-5">
          <p className="text-sm text-foreground">✓ Захиалга бүртгэгдлээ — {state.summary}</p>
          <p className="mt-2 text-xs text-muted">Үйлчлүүлэгчид өгөх код</p>
          <p className="font-mono text-3xl font-semibold tracking-[0.3em] text-primary">
            {state.code}
          </p>
        </div>
      )}
      {state.status === "error" && (
        <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="serviceId" value={serviceId} />
        <input type="hidden" name="packageId" value={packageId} />

        {multiBranch && (
          <F label="Салбар">
            <select
              name="locationId"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                const m = staff.find((x) => x.id === staffId);
                if (m?.locationId && m.locationId !== e.target.value) setStaffId("");
              }}
              className="field"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name || l.address || l.id}
                </option>
              ))}
            </select>
          </F>
        )}
        {!multiBranch && <input type="hidden" name="locationId" value={locationId} />}

        <F label="Үйлчилгээ / багц">
          <select
            value={item}
            onChange={(e) => {
              setItem(e.target.value);
              setTime("");
            }}
            className="field"
          >
            <option value="">— сонгоно уу —</option>
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
        </F>

        <F label="Мастер">
          <select
            name="staffId"
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setTime("");
            }}
            className="field"
          >
            <option value="">— сонгоно уу —</option>
            {availableStaff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
          </select>
        </F>

        <F label="Огноо">
          <input
            type="date"
            name="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
            className="field"
          />
        </F>

        <F label="Цаг">
          {freeTime ? (
            <input
              type="time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="field"
            />
          ) : (
            <select
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="field"
              disabled={!ready || loadingSlots}
            >
              <option value="">
                {!ready
                  ? "Эхлээд үйлчилгээ, мастер сонгоно уу"
                  : loadingSlots
                    ? "Ачаалж байна…"
                    : slots.length === 0
                      ? "Энэ өдөр сул цаг алга"
                      : "— сул цаг —"}
              </option>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </F>

        <F label="Үйлчлүүлэгчийн нэр">
          <input name="customerName" required placeholder="Нэр" className="field" />
        </F>
        <F label="Утасны дугаар">
          <input
            name="customerPhone"
            required
            inputMode="tel"
            placeholder="9900-0000"
            className="field"
          />
        </F>

        <F label="Тэмдэглэл" full>
          <textarea
            name="note"
            rows={2}
            placeholder="Утсаар ярихад хэлсэн хүсэлт, тодруулга"
            className="field resize-none"
          />
        </F>

        <div className="flex flex-wrap gap-5 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="confirmNow"
              defaultChecked
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Шууд баталгаажуулах
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="ignoreHours"
              checked={freeTime}
              onChange={(e) => {
                setFreeTime(e.target.checked);
                setTime("");
              }}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Хуваариас гадуур цаг оруулах
          </label>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "Бүртгэж байна…" : "Захиалга бүртгэх"}
          </button>
        </div>
      </form>
    </div>
  );
}

function F({
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
