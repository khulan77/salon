"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Location, Service, ServicePackage, Staff } from "@/app/lib/types";
import {
  bookAction,
  getAvailableSlotsAction,
  getPackageAvailableSlotsAction,
  type BookState,
} from "@/app/lib/actions";
import { rememberEntry } from "@/app/lib/my-bookings-store";
import { salonToday } from "@/app/lib/time";
import {
  effectivePrice,
  formatDate,
  formatDuration,
  formatPrice,
  hasSale,
  packageTotals,
} from "@/app/lib/format";

// Үйлчлүүлэгч гадаадаас захиалж байсан ч салоны өнөөдрөөс эхэлнэ.
const todayISO = salonToday;

export default function BookingForm({
  services,
  staff,
  locations,
  packages,
  initialServiceId,
  initialStaffId,
  initialLocationId,
  initialPackageId,
}: {
  services: Service[];
  staff: Staff[];
  locations: Location[];
  packages: ServicePackage[];
  initialServiceId?: string;
  initialStaffId?: string;
  initialLocationId?: string;
  initialPackageId?: string;
}) {
  const multiBranch = locations.length > 1;

  // Алхмуудыг салбартай эсэхээс хамааруулан бүрдүүлнэ.
  const stepKeys = useMemo<string[]>(
    () =>
      multiBranch
        ? ["branch", "service", "staff", "datetime", "contact"]
        : ["service", "staff", "datetime", "contact"],
    [multiBranch],
  );
  const stepLabels: Record<string, string> = {
    branch: "Салбар",
    service: packages.length > 0 ? "Үйлчилгээ / Багц" : "Үйлчилгээ",
    staff: "Мастер",
    datetime: "Огноо & цаг",
    contact: "Мэдээлэл",
  };

  const [step, setStep] = useState(0);
  const [locationId, setLocationId] = useState(
    initialLocationId ?? (locations[0]?.id ?? ""),
  );
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [packageId, setPackageId] = useState(initialPackageId ?? "");
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [state, formAction, pending] = useActionState<BookState, FormData>(
    bookAction,
    { status: "idle" },
  );

  const stepKey = stepKeys[step];
  const isLast = step === stepKeys.length - 1;

  const service = services.find((s) => s.id === serviceId);
  const selectedPackage = packages.find((p) => p.id === packageId);
  const selectedLocation = locations.find((l) => l.id === locationId);
  const packageInfo = selectedPackage
    ? packageTotals(selectedPackage, services)
    : null;

  // Салбар (олон бол) болон үйлчилгээнд тохирох мастеруудыг шүүнэ. Багц сонгосон
  // үед салбарын бүх мастер боломжтой. Салбаргүй мастер бүх салбарт үзэгдэнэ.
  const availableStaff = useMemo(
    () =>
      staff.filter((m) => {
        const okBranch = !multiBranch || !m.locationId || m.locationId === locationId;
        const okService =
          !!packageId ||
          m.serviceIds.length === 0 ||
          !serviceId ||
          m.serviceIds.includes(serviceId);
        return okBranch && okService;
      }),
    [staff, serviceId, packageId, locationId, multiBranch],
  );
  const selectedStaff = staff.find((s) => s.id === staffId);

  // If arriving with a prefilled selection, skip ahead to the right step.
  useEffect(() => {
    if (initialPackageId) setStep(stepKeys.indexOf("staff"));
    else if (initialServiceId && initialStaffId) setStep(stepKeys.indexOf("datetime"));
    else if (initialServiceId || initialStaffId) setStep(stepKeys.indexOf("staff"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load available slots whenever the selection or date changes.
  useEffect(() => {
    if (!staffId || !date || (!serviceId && !packageId)) {
      setSlots([]);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    const req = packageId
      ? getPackageAvailableSlotsAction(packageId, staffId, date)
      : getAvailableSlotsAction(serviceId, staffId, date);
    req
      .then((s) => {
        if (active) setSlots(s);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [serviceId, packageId, staffId, date]);

  // Reset time if it is no longer available.
  useEffect(() => {
    if (time && !slots.includes(time)) setTime("");
  }, [slots, time]);

  // Захиалга амжилттай болмогц кодыг энэ төхөөрөмжид сануулна.
  useEffect(() => {
    if (state.status === "success") {
      rememberEntry({ code: state.summary.code, phone: state.summary.phone });
    }
  }, [state]);

  const canNext =
    (stepKey === "branch" && !!locationId) ||
    (stepKey === "service" && (!!serviceId || !!packageId)) ||
    (stepKey === "staff" && !!staffId) ||
    (stepKey === "datetime" && !!date && !!time) ||
    stepKey === "contact";

  // Багц сонгоход дан үйлчилгээг цэвэрлэнэ (ба эсрэгээр).
  const chooseService = (id: string) => {
    setServiceId(id);
    setPackageId("");
    if (staffId) {
      const m = staff.find((x) => x.id === staffId);
      if (m && m.serviceIds.length > 0 && !m.serviceIds.includes(id)) setStaffId("");
    }
  };
  const choosePackage = (id: string) => {
    setPackageId(id);
    setServiceId("");
  };

  if (state.status === "success") {
    return (
      <div className="card mt-10 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-3xl">
          ✓
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
          Захиалга амжилттай!
        </h2>
        <p className="mt-2 text-muted">
          Таны захиалгыг хүлээн авлаа. Бид тантай удахгүй холбогдож баталгаажуулна.
        </p>

        <div className="mx-auto mt-7 max-w-sm rounded-3xl bg-primary-soft/60 p-6">
          <p className="text-xs font-medium text-muted">Таны захиалгын код</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em] text-primary">
            {state.summary.code}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted">
            Энэ кодоор захиалгаа хянах, цуцлах боломжтой. Хадгалж авна уу.
          </p>
        </div>

        <div className="mx-auto mt-4 max-w-sm rounded-3xl bg-surface-2/70 p-6 text-left text-sm">
          {multiBranch && selectedLocation && (
            <Row label="Салбар" value={selectedLocation.name || selectedLocation.address || "—"} />
          )}
          <Row label={packageId ? "Багц" : "Үйлчилгээ"} value={state.summary.service} />
          <Row label="Мастер" value={state.summary.staff} />
          <Row label="Огноо" value={formatDate(state.summary.date)} />
          <Row label="Цаг" value={state.summary.time} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/my"
            className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Захиалгаа харах
          </Link>
          <Link
            href="/"
            className="rounded-full bg-surface-2 px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-border/60"
          >
            Нүүр хуудас
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* Stepper */}
      <ol className="flex items-center justify-between">
        {stepKeys.map((key, i) => (
          <li key={key} className="flex flex-1 items-center">
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
                {stepLabels[key]}
              </span>
            </div>
            {i < stepKeys.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="card mt-8 p-6 sm:p-8">
        {/* Step: branch */}
        {stepKey === "branch" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Салбар сонгох
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {locations.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLocationId(l.id);
                    // Өөр салбарын мастер сонгосон байвал цэвэрлэнэ.
                    const m = staff.find((x) => x.id === staffId);
                    if (m?.locationId && m.locationId !== l.id) setStaffId("");
                  }}
                  className={`flex items-start gap-3 rounded-2xl p-4 text-left transition-colors ${
                    locationId === l.id
                      ? "bg-primary-soft ring-2 ring-primary"
                      : "bg-surface-2/60 hover:bg-surface-2"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-xl">
                    🏢
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {l.name || l.address || "Салбар"}
                    </span>
                    {l.address && (
                      <span className="block text-xs text-muted">{l.address}</span>
                    )}
                    <span className="mt-0.5 block text-xs text-muted">
                      🕙 {l.openTime}–{l.closeTime}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: service / package */}
        {stepKey === "service" && (
          <div>
            {packages.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  🎁 Багц сонгох
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Хэд хэдэн үйлчилгээг нэг дор — хямд үнээр.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {packages.map((p) => {
                    const t = packageTotals(p, services);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => choosePackage(p.id)}
                        className={`flex items-start gap-3 rounded-2xl p-4 text-left transition-colors ${
                          packageId === p.id
                            ? "bg-primary-soft ring-2 ring-primary"
                            : "bg-surface-2/60 hover:bg-surface-2"
                        }`}
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-xl">
                          {p.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">
                            {p.name}
                          </span>
                          <span className="block text-xs text-muted">
                            {t.saved > 0 && <s className="mr-1">{formatPrice(t.regular)}</s>}
                            <span className="font-semibold text-rose-600">
                              {formatPrice(p.price)}
                            </span>
                            {t.savePercent > 0 && ` · −${t.savePercent}%`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <h2 className="font-display text-xl font-semibold text-foreground">
              {packages.length > 0 ? "Эсвэл дан үйлчилгээ" : "Үйлчилгээ сонгох"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => chooseService(s.id)}
                  className={`flex items-center gap-3 rounded-2xl p-4 text-left transition-colors ${
                    serviceId === s.id
                      ? "bg-primary-soft ring-2 ring-primary"
                      : "bg-surface-2/60 hover:bg-surface-2"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-xl">
                    {s.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{s.name}</span>
                    <span className="block text-xs text-muted">
                      {hasSale(s) && <s className="mr-1">{formatPrice(s.price)}</s>}
                      <span className={hasSale(s) ? "font-semibold text-rose-600" : ""}>
                        {formatPrice(effectivePrice(s))}
                      </span>{" "}
                      · {formatDuration(s.durationMin)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: staff */}
        {stepKey === "staff" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Мастер сонгох
            </h2>
            {availableStaff.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {multiBranch
                  ? "Энэ салбарт тохирох мастер алга байна. Өөр салбар сонгож үзнэ үү."
                  : "Боломжтой мастер алга байна."}
              </p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {availableStaff.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setStaffId(m.id)}
                    className={`flex items-center gap-3 rounded-2xl p-4 text-left transition-colors ${
                      staffId === m.id
                        ? "bg-primary-soft ring-2 ring-primary"
                        : "bg-surface-2/60 hover:bg-surface-2"
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

        {/* Step: date & time */}
        {stepKey === "datetime" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Огноо ба цаг сонгох
            </h2>
            {packageInfo && packageInfo.durationMin > 0 && (
              <p className="mt-2 text-sm text-muted">
                Багцын нийт үргэлжлэх хугацаа: {formatDuration(packageInfo.durationMin)}
              </p>
            )}
            <label className="mt-5 block text-sm font-medium text-foreground">Огноо</label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
              className="mt-2 w-full rounded-xl bg-surface-2/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/60"
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
                    className={`rounded-full px-2 py-2.5 text-sm transition-colors ${
                      time === slot
                        ? "bg-primary text-white"
                        : "bg-surface-2/70 text-foreground hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: contact + confirm */}
        {stepKey === "contact" && (
          <form action={formAction}>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Холбоо барих мэдээлэл
            </h2>

            <input type="hidden" name="serviceId" value={serviceId} />
            <input type="hidden" name="packageId" value={packageId} />
            <input type="hidden" name="staffId" value={staffId} />
            <input type="hidden" name="locationId" value={locationId} />
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
            <div className="mt-6 rounded-2xl bg-surface-2/70 p-5 text-sm">
              {multiBranch && (
                <Row
                  label="Салбар"
                  value={selectedLocation?.name || selectedLocation?.address || "—"}
                />
              )}
              <Row
                label={selectedPackage ? "Багц" : "Үйлчилгээ"}
                value={
                  selectedPackage
                    ? `${selectedPackage.emoji} ${selectedPackage.name}`
                    : service?.name ?? "—"
                }
              />
              <Row label="Мастер" value={selectedStaff?.name ?? "—"} />
              <Row label="Огноо" value={formatDate(date)} />
              <Row label="Цаг" value={time || "—"} />
              {(service || selectedPackage) && (
                <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium text-foreground">
                  <span>Нийт төлбөр</span>
                  <span>
                    {selectedPackage ? (
                      <>
                        {packageInfo && packageInfo.saved > 0 && (
                          <s className="mr-2 font-normal text-muted">
                            {formatPrice(packageInfo.regular)}
                          </s>
                        )}
                        <span className="text-rose-600">{formatPrice(selectedPackage.price)}</span>
                      </>
                    ) : service ? (
                      <>
                        {hasSale(service) && (
                          <s className="mr-2 font-normal text-muted">
                            {formatPrice(service.price)}
                          </s>
                        )}
                        <span className={hasSale(service) ? "text-rose-600" : ""}>
                          {formatPrice(effectivePrice(service))}
                        </span>
                      </>
                    ) : null}
                  </span>
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
                className="rounded-full bg-surface-2 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-border/60"
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

        {/* Nav (all but last step) */}
        {!isLast && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-full bg-surface-2 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-border/60 disabled:opacity-40"
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
          border: none;
          background: color-mix(in srgb, var(--surface-2) 60%, transparent);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px var(--ring);
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
