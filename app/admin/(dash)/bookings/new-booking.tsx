"use client";

import { Fragment, useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  initialStaffId,
  initialTime,
  autoOpen = false,
  closeHref,
}: {
  services: Service[];
  staff: Staff[];
  locations: Location[];
  packages: ServicePackage[];
  /** Хуанлиас дуудахад харж буй өдөр, салбарыг урьдчилж бөглөнө. */
  initialDate?: string;
  initialLocationId?: string;
  /** Хуанлийн нүднээс нээхэд урьдчилж сонгогдох мастер, цаг. */
  initialStaffId?: string;
  initialTime?: string;
  autoOpen?: boolean;
  /** URL-аас нээгдсэн drawer хаагдахад query-г цэвэрлэх холбоос. */
  closeHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [state, formAction, pending] = useActionState<AdminBookState, FormData>(
    adminCreateBookingAction,
    { status: "idle" },
  );
  // useActionState-ийн сүүлийн хариу component амьд байх хугацаанд хадгалагддаг.
  // Drawer-ийг шинээр нээхэд өмнөх амжилтын код/алдааг дахин харуулахгүй.
  const [hiddenState, setHiddenState] = useState<AdminBookState | null>(null);

  const multiBranch = locations.length > 1;
  const [locationId, setLocationId] = useState(
    initialLocationId ?? locations[0]?.id ?? "",
  );
  // Үйлчилгээ, багцыг нэг сонгогчид нэгтгэв: "svc:<id>" эсвэл "pkg:<id>".
  // Багцыг зөвхөн эхний мөрөнд, ганцаараа сонгож болно.
  const [lines, setLines] = useState<Line[]>([
    { item: "", staffId: initialStaffId ?? "" },
  ]);
  const [date, setDate] = useState(initialDate ?? salonToday());
  const [time, setTime] = useState(initialTime ?? "");
  const [freeTime, setFreeTime] = useState(false);

  const closeDrawer = () => {
    setOpen(false);
    if (closeHref) router.replace(closeHref, { scroll: false });
  };

  const openFresh = () => {
    setHiddenState(state);
    setLocationId(initialLocationId ?? locations[0]?.id ?? "");
    setLines([{ item: "", staffId: initialStaffId ?? "" }]);
    setDate(initialDate ?? salonToday());
    setTime(initialTime ?? "");
    setFreeTime(false);
    setLoaded({ key: "", slots: [] });
    setOpen(true);
  };

  // Drawer нээлттэй үед арын хуанли байрандаа үлдэж, зөвхөн drawer гүйнэ.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        if (closeHref) router.replace(closeHref, { scroll: false });
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeHref, router]);

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
    if (!initialTime) setTime("");
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
        onClick={openFresh}
        className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-hover sm:px-5"
      >
        + Захиалга
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Захиалгын маягтыг хаах"
        onClick={closeDrawer}
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-booking-title"
        className="relative flex h-[calc(100dvh-0.35rem)] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:h-auto sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-3xl sm:border sm:border-border"
      >
      <div className="shrink-0 border-b border-border/60 px-5 pb-4 pt-5 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="new-booking-title" className="font-display text-2xl font-semibold text-foreground sm:text-xl">
            Шинэ цаг захиалга
          </h2>
          <p className="mt-0.5 hidden text-xs text-muted sm:block sm:text-sm">
            Хуанли ард харагдана. Esc дарж хааж болно.
          </p>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Хаах"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl leading-none text-muted transition-colors hover:text-foreground"
        >
          ×
        </button>
        </div>
        <div className="mt-4 flex w-fit rounded-full bg-surface-2 p-1">
          <span className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-foreground shadow-sm">Цаг захиалга</span>
          <span className="px-5 py-2 text-sm text-muted">Чөлөө</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 sm:px-6 sm:pb-6">

      {state !== hiddenState && state.status === "success" && (
        <div className="mt-5 rounded-2xl bg-primary-soft/60 p-5">
          <p className="text-sm text-foreground">✓ Захиалга бүртгэгдлээ — {state.summary}</p>
          <p className="mt-2 text-xs text-muted">Үйлчлүүлэгчид өгөх код</p>
          <p className="break-words font-mono text-2xl font-semibold tracking-[0.2em] text-primary sm:text-3xl">
            {state.code}
          </p>
        </div>
      )}
      {state !== hiddenState && state.status === "error" && (
        <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-5 grid gap-5 sm:grid-cols-2">
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

        <div className="sm:col-span-2">
          <h3 className="mb-3 text-lg font-semibold text-foreground">Үйлчлүүлэгч</h3>
          <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
            <button type="button" aria-label="Тогтмол үйлчлүүлэгч" className="hidden min-h-14 rounded-xl border border-border text-2xl text-muted sm:block">★</button>
            <input name="customerName" required placeholder="Нэр" className="field !min-h-14 !rounded-xl !bg-surface" />
            <input
              name="customerPhone"
              required
              inputMode="tel"
              placeholder="Утас"
              className="field !min-h-14 !rounded-xl !bg-surface sm:col-span-2"
            />
          </div>
        </div>

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
                full
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
                {i === 0 && lines.length === 1 ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-surface sm:grid sm:grid-cols-2">
                    {packages.map((p) => (
                      <ServiceChoice key={p.id} active={line.item === `pkg:${p.id}`} onClick={() => updateLine(i, { item: `pkg:${p.id}` })} name={`${p.emoji} ${p.name}`} meta={formatPrice(p.price)} />
                    ))}
                    {services.map((s) => (
                      <ServiceChoice key={s.id} active={line.item === `svc:${s.id}`} onClick={() => {
                        const m = staff.find((x) => x.id === line.staffId);
                        const keep = !m || m.serviceIds.length === 0 || m.serviceIds.includes(s.id);
                        updateLine(i, { item: `svc:${s.id}`, staffId: keep ? line.staffId : "" });
                      }} name={s.name} meta={`${formatDuration(s.durationMin)} · ${formatPrice(effectivePrice(s))}`} />
                    ))}
                  </div>
                ) : <select
                  value={line.item}
                  onChange={(e) => updateLine(i, { item: e.target.value })}
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
                </select>}
              </F>

              <F label={i === 0 ? "Үндсэн ажилтан" : "Мастер"} full>
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

        <div className="hidden sm:col-span-2 sm:block rounded-2xl bg-primary-soft/60 px-4 py-3">
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

        <F label="Огноо" full>
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

        <F label="Эхлэх цаг" full>
          {freeTime ? (
            <input
              type="time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="field"
            />
          ) : (
            <div>
              <input type="hidden" name="time" value={time} />
              {!ready || loadingSlots || slots.length === 0 ? (
                <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted">
                  {!ready ? "Эхлээд үйлчилгээ, мастер сонгоно уу" : loadingSlots ? "Ачаалж байна…" : "Энэ өдөр сул цаг алга"}
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => <button key={s} type="button" onClick={() => setTime(s)} className={`min-h-12 rounded-xl border text-sm tabular-nums ${time === s ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground"}`}>{s}</button>)}
                </div>
              )}
            </div>
          )}
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

        <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border/70 bg-surface/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:col-span-2 sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
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

function ServiceChoice({ active, onClick, name, meta }: { active: boolean; onClick: () => void; name: string; meta: string }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 border-b border-border/70 px-4 py-4 text-left sm:border-r sm:[&:nth-child(even)]:border-r-0">
      <span className={`h-6 w-6 shrink-0 rounded-full border-2 ${active ? "border-primary bg-primary shadow-[inset_0_0_0_5px_white]" : "border-border"}`} />
      <span className="min-w-0">
        <span className="block truncate text-base font-medium text-foreground">{name}</span>
        <span className="mt-0.5 block text-sm text-muted">{meta}</span>
      </span>
    </button>
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
    <div className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {aside}
      </span>
      {children}
    </div>
  );
}
