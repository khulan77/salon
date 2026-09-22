"use client";

import { Fragment, useActionState, useEffect, useMemo, useState } from "react";
import type { Location, Service, ServicePackage, Staff } from "@/app/lib/types";
import {
  adminCreateBookingAction,
  getMultiAvailableSlotsAction,
  getPackageAvailableSlotsAction,
  type AdminBookState,
} from "@/app/lib/actions";
import {
  effectivePrice,
  formatDuration,
  formatPrice,
  packageTotals,
} from "@/app/lib/format";
import { salonToday } from "@/app/lib/time";
import { MAX_ITEMS } from "@/app/lib/booking-items";

/** Нэг мөр = нэг үйлчилгээ (эсвэл багц) ба түүнийг хийх мастер. */
type Line = { item: string; staffId: string };

/**
 * Утсаар залгасан үйлчлүүлэгчийг админ өөрөө бүртгэх маягт. Үйлчлүүлэгчийн
 * хэсэгтэй ижил сул цагийн хөдөлгүүрийг ашиглана — ялгаа нь захиалгыг шууд
 * баталгаажуулах, шаардлагатай бол хуваариас гадуур цаг оруулах боломж.
 *
 * "+ Үйлчилгээ нэмэх" дарж нэг үйлчлүүлэгчид хэд хэдэн үйлчилгээ бүртгэнэ —
 * өөр мастерт оногдвол зэрэг, нэг мастерт бол дараалан эхэлнэ.
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
  // Багцыг зөвхөн эхний мөрөнд, ганцаараа сонгож болно.
  const [lines, setLines] = useState<Line[]>([{ item: "", staffId: "" }]);
  const [date, setDate] = useState(initialDate ?? salonToday());
  const [time, setTime] = useState("");
  const [freeTime, setFreeTime] = useState(false);

  // Drawer нээлттэй үед арын хуанли байрандаа үлдэж, зөвхөн drawer гүйнэ.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const packageId = lines[0].item.startsWith("pkg:") ? lines[0].item.slice(4) : "";
  const packageStaffId = packageId ? lines[0].staffId : "";
  const items = useMemo(
    () =>
      packageId
        ? []
        : lines.map((l) => ({
            serviceId: l.item.startsWith("svc:") ? l.item.slice(4) : "",
            staffId: l.staffId,
          })),
    [lines, packageId],
  );

  /** Салбар болон үйлчилгээнд тохирох мастерууд (багц бол салбарын бүгд). */
  const staffOptions = (serviceId: string) =>
    staff.filter((m) => {
      const okBranch = !multiBranch || !m.locationId || m.locationId === locationId;
      const okService =
        !serviceId || m.serviceIds.length === 0 || m.serviceIds.includes(serviceId);
      return okBranch && okService;
    });

  const updateLine = (i: number, patch: Partial<Line>) => {
    setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    setTime("");
  };

  // Сул цагийг сонголт бүрд шинэчилнэ. Хариуг түлхүүртэй нь хамт хадгалснаар
  // "ачаалж байна" төлөвийг тооцоолж гаргана — effect дотор setState хийхгүй.
  const key = packageId
    ? `pkg|${packageId}|${packageStaffId}|${date}|${locationId}`
    : `svc|${items.map((i) => `${i.serviceId}:${i.staffId}`).join(",")}|${date}|${locationId}`;
  const ready = Boolean(
    date &&
      (packageId
        ? packageStaffId
        : items.length > 0 && items.every((i) => i.serviceId && i.staffId)),
  );
  const [loaded, setLoaded] = useState<{ key: string; slots: string[] }>({
    key: "",
    slots: [],
  });

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const req = packageId
      ? getPackageAvailableSlotsAction(packageId, packageStaffId, date, locationId)
      : getMultiAvailableSlotsAction(items, date, locationId);
    req.then((slots) => {
      if (active) setLoaded({ key, slots });
    });
    return () => {
      active = false;
    };
  }, [key, ready, packageId, packageStaffId, items, date, locationId]);

  const fresh = loaded.key === key;
  const slots = fresh ? loaded.slots : [];
  const loadingSlots = ready && !fresh;

  const selectedPackage = packages.find((p) => p.id === packageId);
  const selectedServices = lines
    .map((line) =>
      line.item.startsWith("svc:")
        ? services.find((service) => service.id === line.item.slice(4))
        : undefined,
    )
    .filter((service): service is Service => Boolean(service));
  const packageSummary = selectedPackage
    ? packageTotals(selectedPackage, services)
    : undefined;
  const totalPrice = selectedPackage?.price ??
    selectedServices.reduce((sum, service) => sum + effectivePrice(service), 0);
  const totalDuration = packageSummary?.durationMin ??
    selectedServices.reduce((sum, service) => sum + service.durationMin, 0);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Захиалгын маягтыг хаах"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-booking-title"
        className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:max-h-none sm:max-w-xl sm:rounded-none sm:border-l sm:border-border"
      >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6 sm:py-5">
        <div>
          <h2 id="new-booking-title" className="font-display text-lg font-semibold text-foreground sm:text-xl">
            Шинэ захиалга
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            Хуанли ард харагдана. Esc дарж хааж болно.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Хаах"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl leading-none text-muted transition-colors hover:text-foreground"
        >
          ×
        </button>
      </div>

      <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">

      {state.status === "success" && (
        <div className="mt-5 rounded-2xl bg-primary-soft/60 p-5">
          <p className="text-sm text-foreground">✓ Захиалга бүртгэгдлээ — {state.summary}</p>
          <p className="mt-2 text-xs text-muted">Үйлчлүүлэгчид өгөх код</p>
          <p className="break-words font-mono text-2xl font-semibold tracking-[0.2em] text-primary sm:text-3xl">
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
        {/* Мөр бүрд serviceId + staffId хос дараалан — сервер i дэхийг нь
            хооронд нь холбож уншина. Багц бол serviceId хоосон. */}
        {lines.map((l, i) => (
          <Fragment key={i}>
            <input
              type="hidden"
              name="serviceId"
              value={l.item.startsWith("svc:") ? l.item.slice(4) : ""}
            />
            <input type="hidden" name="staffId" value={l.staffId} />
          </Fragment>
        ))}
        <input type="hidden" name="packageId" value={packageId} />

        {multiBranch && (
          <F label="Салбар">
            <select
              name="locationId"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                // Өөр салбарын мастер сонгосон мөрүүдийг цэвэрлэнэ.
                setLines(
                  lines.map((l) => {
                    const m = staff.find((x) => x.id === l.staffId);
                    return m?.locationId && m.locationId !== e.target.value
                      ? { ...l, staffId: "" }
                      : l;
                  }),
                );
                setTime("");
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

        {lines.map((line, i) => {
          const lineService = line.item.startsWith("svc:") ? line.item.slice(4) : "";
          // Бусад мөрөнд сонгосон үйлчилгээг давхар сонгуулахгүй.
          const taken = new Set(lines.filter((_, j) => j !== i).map((l) => l.item));
          return (
            <Fragment key={i}>
              <F
                label={i === 0 ? "Үйлчилгээ / багц" : `Үйлчилгээ ${i + 1}`}
                aside={
                  i > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLines(lines.filter((_, j) => j !== i));
                        setTime("");
                      }}
                      className="text-xs text-muted hover:text-rose-600"
                    >
                      Хасах
                    </button>
                  )
                }
              >
                <select
                  value={line.item}
                  onChange={(e) => {
                    const next = e.target.value;
                    // Мастер энэ үйлчилгээг хийдэггүй бол цэвэрлэнэ.
                    const m = staff.find((x) => x.id === line.staffId);
                    const svc = next.startsWith("svc:") ? next.slice(4) : "";
                    const keep =
                      !m || !svc || m.serviceIds.length === 0 || m.serviceIds.includes(svc);
                    updateLine(i, { item: next, staffId: keep ? line.staffId : "" });
                  }}
                  className="field"
                >
                  <option value="">— сонгоно уу —</option>
                  {i === 0 && lines.length === 1 && packages.length > 0 && (
                    <optgroup label="Багц">
                      {packages.map((p) => (
                        <option key={p.id} value={`pkg:${p.id}`}>
                          {p.emoji} {p.name} — {formatPrice(p.price)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Үйлчилгээ">
                    {services
                      .filter((s) => !taken.has(`svc:${s.id}`))
                      .map((s) => (
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
                  value={line.staffId}
                  onChange={(e) => updateLine(i, { staffId: e.target.value })}
                  className="field"
                >
                  <option value="">— сонгоно уу —</option>
                  {staffOptions(lineService).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.emoji} {m.name}
                    </option>
                  ))}
                </select>
              </F>
            </Fragment>
          );
        })}

        {!packageId && lines.length < MAX_ITEMS && (
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => {
                setLines([...lines, { item: "", staffId: "" }]);
                setTime("");
              }}
              className="min-h-11 rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            >
              + Үйлчилгээ нэмэх
            </button>
            {lines.length > 1 && (
              <p className="mt-2 text-xs text-muted">
                Өөр мастерт оногдсон үйлчилгээнүүд зэрэг, нэг мастерт бол дараалан
                эхэлнэ. Цагийн жагсаалтад бүх мастер зэрэг сул цаг л гарна.
              </p>
            )}
          </div>
        )}

        <div className="sm:col-span-2 rounded-2xl bg-primary-soft/60 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Сонголтын дүн
              </p>
              <p className="mt-1 truncate text-sm text-foreground">
                {selectedPackage
                  ? `${selectedPackage.emoji} ${selectedPackage.name}`
                  : selectedServices.length > 0
                    ? selectedServices.map((service) => service.name).join(" + ")
                    : "Үйлчилгээ сонгоогүй"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold tabular-nums text-primary">
                {formatPrice(totalPrice)}
              </p>
              {totalDuration > 0 && (
                <p className="text-xs text-muted">{formatDuration(totalDuration)}</p>
              )}
            </div>
          </div>
        </div>

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

        <div className="sticky -bottom-px z-10 -mx-5 mt-1 flex items-center justify-between gap-4 border-t border-border/70 bg-surface/95 px-5 pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:col-span-2 sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">Нийт үнэ</p>
            <p className="font-semibold tabular-nums text-foreground">{formatPrice(totalPrice)}</p>
          </div>
          <button
            type="submit"
            disabled={pending || !ready || !time}
            className="min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? "Бүртгэж байна…" : "Захиалга бүртгэх"}
          </button>
        </div>
      </form>
      </div>
      </section>
    </div>
  );
}

function F({
  label,
  children,
  full,
  aside,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  /** Шошгоны баруун талд — жишээ нь "Хасах" товч. */
  aside?: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {aside}
      </span>
      {children}
    </label>
  );
}
