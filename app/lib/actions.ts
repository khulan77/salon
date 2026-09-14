"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, isAdmin, signOut } from "./auth";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { isAdminApiConfigured, upsertStaffAuthUser } from "./supabase/admin";
import {
  createLocation,
  createPackage,
  createPayment,
  createReview,
  createService,
  createStaff,
  deleteBooking,
  deleteLocation,
  deletePackage,
  deleteReview,
  deleteService,
  deleteStaff,
  getAvailableSlots,
  getBooking,
  getBookingByCodeAndPhone,
  getBookingGroup,
  getLocation,
  getMultiAvailableSlots,
  getPackage,
  getPackageAvailableSlots,
  getPackageDuration,
  getPayment,
  getService,
  getSettings,
  getStaff,
  getStaffForService,
  getStaffMember,
  hasBookingConflict,
  updateBooking,
  updateBookingAmounts,
  updateBookingStaffLocked,
  updateBookingStatus,
  updatePayment,
  updateLocation,
  updatePackage,
  updateReview,
  updateService,
  updateSettings,
  updateStaff,
} from "./db";
import { cookies } from "next/headers";
import { LOCATION_COOKIE } from "./location";
import { deleteImage, saveImage } from "./upload";
import { geocodeAddress } from "./geocode";
import { cancelledBookingEmail, newBookingEmail, sendEmail } from "./email";
import { bookingActionUrl, readBookingAction } from "./booking-token";
import {
  callbackUrl,
  isMockPayment,
  resolveProvider,
} from "./payment/provider";
import {
  draftItemName,
  draftStaffNames,
  finalizePaidBooking,
  placeDraftBookings,
} from "./payment/flow";
import { draftItems, MAX_ITEMS } from "./booking-items";
import { effectivePrice, formatDate, normalizeSalePercent } from "./format";
import { salonInstant } from "./time";
import type {
  Booking,
  BookingDraft,
  BookingStatus,
  DraftItem,
  Location,
  MyBooking,
  ServicePackage,
  Settings,
} from "./types";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

/* ---------------- Мэдэгдэл (Resend) ---------------- */

/**
 * Мэдэгдэл хүлээн авагчид — ADMIN_EMAILS дахь админ(ууд), мөн заасан бол
 * тухайн мастер. Тохируулаагүй бол хоосон жагсаалт буцаана (sendEmail no-op).
 */
function notifyRecipients(staffEmail?: string): string[] {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return Array.from(new Set([...admins, ...(staffEmail ? [staffEmail] : [])]));
}

/** Захиалгын үйлчилгээ/багцын нэрийг мэдэгдэлд харуулах хэлбэрээр буцаана. */
async function bookingItemName(booking: Booking): Promise<string> {
  if (booking.packageId) {
    const pkg = await getPackage(booking.packageId);
    return pkg ? `🎁 ${pkg.name} (багц)` : "Багц";
  }
  const service = await getService(booking.serviceId);
  return service?.name ?? "Үйлчилгээ";
}

/**
 * Захиалга цуцлагдсаныг имэйлээр мэдэгдэнэ. Үйлчлүүлэгч цуцалбал админ болон
 * мастер хоёулаа, мастер өөрөө цуцалбал зөвхөн админ мэдэгдэл авна.
 */
async function notifyCancellation(
  booking: Booking,
  by: "customer" | "staff",
): Promise<void> {
  const staff = await getStaffMember(booking.staffId);
  const to = notifyRecipients(by === "customer" ? staff?.email : undefined);
  if (to.length === 0) return;

  const [item, { salonName }] = await Promise.all([
    bookingItemName(booking),
    getSettings(),
  ]);
  await sendEmail({
    to,
    subject: `Захиалга цуцлагдлаа — ${item} (${formatDate(booking.date)} ${booking.time})`,
    html: cancelledBookingEmail({
      salonName,
      service: item,
      staff: staff?.name ?? "—",
      date: formatDate(booking.date),
      time: booking.time,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      code: booking.code,
      by,
    }),
  });
}

/* ---------------- Auth ---------------- */

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase тохируулаагүй байна. .env.local дотор NEXT_PUBLIC_SUPABASE_URL-ээ оруулна уу.",
    };
  }
  if (!email || !password) {
    return { error: "Имэйл болон нууц үгээ оруулна уу." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Имэйл эсвэл нууц үг буруу байна." };
  }

  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "staff") redirect("/portal");

  // Authenticated but not recognised as admin or staff.
  await supabase.auth.signOut();
  return { error: "Энэ хаяг системд бүртгэлгүй байна. Админтай холбогдоно уу." };
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}

/* ---------------- Public: сонгосон салбар ---------------- */

/** Үйлчлүүлэгчийн сонгосон салбарыг cookie-д хадгална (толгойн сонгогчоос). */
export async function selectLocationAction(locationId: string): Promise<void> {
  const store = await cookies();
  const clean = String(locationId ?? "").trim();
  if (clean) {
    store.set(LOCATION_COOKIE, clean, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  revalidatePath("/", "layout");
}

/* ---------------- Public booking ---------------- */

/** Available HH:mm start times for the picker (respects hours, duration, bookings). */
export async function getAvailableSlotsAction(
  serviceId: string,
  staffId: string,
  date: string,
  locationId?: string,
): Promise<string[]> {
  if (!serviceId || !staffId || !date) return [];
  return getAvailableSlots(serviceId, staffId, date, locationId);
}

/** Багцаар захиалахад боломжит эхлэх цагууд (нийт хугацаагаар тооцно). */
export async function getPackageAvailableSlotsAction(
  packageId: string,
  staffId: string,
  date: string,
  locationId?: string,
): Promise<string[]> {
  if (!packageId || !staffId || !date) return [];
  return getPackageAvailableSlots(packageId, staffId, date, locationId);
}

/**
 * Хэд хэдэн үйлчилгээг нэг дор захиалахад бүх мастер зэрэг сул байх цагууд.
 * Ганц үйлчилгээнд ч ажиллана (getAvailableSlots-той ижил хариу).
 */
export async function getMultiAvailableSlotsAction(
  items: DraftItem[],
  date: string,
  locationId?: string,
): Promise<string[]> {
  const clean = items
    .slice(0, MAX_ITEMS)
    .filter((i) => i.serviceId && i.staffId)
    .map((i) => ({ serviceId: String(i.serviceId), staffId: String(i.staffId) }));
  if (clean.length === 0 || clean.length !== items.length || !date) return [];
  return getMultiAvailableSlots(clean, date, locationId);
}

/**
 * Захиалгын формоос ноорог уншина — үйлчлүүлэгч ба админд ижил. Олон
 * үйлчилгээтэй бол `serviceId`, `staffId` талбарууд дараалан давтагдана
 * (i дэх үйлчилгээг i дэх мастер хийнэ).
 */
function readBookingForm(formData: FormData): BookingDraft {
  const serviceIds = formData.getAll("serviceId").map(String);
  const staffIds = formData.getAll("staffId").map(String);
  const items = serviceIds.map((serviceId, i) => ({ serviceId, staffId: staffIds[i] ?? "" }));
  return {
    serviceId: serviceIds[0] ?? "",
    packageId: String(formData.get("packageId") ?? "") || undefined,
    staffId: staffIds[0] ?? "",
    // Ганц үйлчилгээтэй бол ноорог өмнөх хэлбэрээрээ үлдэнэ.
    ...(items.length > 1 && { items }),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    customerName: String(formData.get("customerName") ?? "").trim(),
    customerPhone: String(formData.get("customerPhone") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
    locationId: String(formData.get("locationId") ?? "").trim() || undefined,
  };
}

/**
 * Ноорогийг сервер талд бүрэн шалгана — клиент талын шүүлтэд найдахгүй.
 * Алдаатай бол харуулах мессеж, зөв бол null буцаана.
 */
async function validateDraft(
  draft: BookingDraft,
  opts?: { checkAvailability?: boolean },
): Promise<string | null> {
  if ((!draft.serviceId && !draft.packageId) || !draft.staffId) {
    return "Үйлчилгээ, мастер, огноо, цагийг бүрэн сонгоно уу.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !/^\d{2}:\d{2}$/.test(draft.time)) {
    return "Огноо, цагийг зөв сонгоно уу.";
  }
  if (draft.customerName.length < 2) return "Нэрээ оруулна уу.";
  if (!/^[0-9\s+\-()]{6,}$/.test(draft.customerPhone)) {
    return "Утасны дугаараа зөв оруулна уу.";
  }

  const items = draftItems(draft);
  if (draft.packageId) {
    const staff = await getStaffMember(draft.staffId);
    if (!staff || !staff.active) return "Сонгосон мастер олдсонгүй.";
    const pkg = await getPackage(draft.packageId);
    if (!pkg || !pkg.active) return "Сонгосон багц олдсонгүй.";
  } else {
    if (items.length > MAX_ITEMS) return `Нэг дор ${MAX_ITEMS} хүртэл үйлчилгээ сонгоно уу.`;
    if (items.some((i) => !i.serviceId || !i.staffId)) {
      return "Үйлчилгээ бүрд мастер сонгоно уу.";
    }
    if (new Set(items.map((i) => i.serviceId)).size !== items.length) {
      return "Нэг үйлчилгээг давхар сонгосон байна.";
    }
    for (const item of items) {
      const service = await getService(item.serviceId);
      const staffList = await getStaffForService(item.serviceId);
      if (!service || !staffList.some((s) => s.id === item.staffId)) {
        return "Сонгосон үйлчилгээ эсвэл мастер олдсонгүй.";
      }
    }
  }

  if (opts?.checkAvailability === false) return null;

  // Цагийг сервер дээр дахин шалгана: захиалагдаагүй, ажлын цагт багтсан,
  // өнгөрөөгүй байх ёстой. Олон үйлчилгээтэй бол бүх мастер зэрэг сул байх.
  const available = draft.packageId
    ? await getPackageAvailableSlots(
        draft.packageId,
        draft.staffId,
        draft.date,
        draft.locationId,
      )
    : await getMultiAvailableSlots(items, draft.date, draft.locationId);
  if (!available.includes(draft.time)) {
    return "Уучлаарай, энэ цаг боломжгүй болсон байна. Өөр цаг сонгоно уу.";
  }
  return null;
}

export type BookState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      summary: {
        service: string;
        staff: string;
        date: string;
        time: string;
        code: string;
        /** Олон үйлчилгээтэй бол үйлчилгээ бүрийн код (эхнийх нь `code`). */
        codes: string[];
        phone: string;
      };
    };

/** Шинэ захиалгад оролцох мастеруудын имэйл (давхардалгүй). */
async function staffEmailsOf(bookings: Booking[]): Promise<string[]> {
  const staff = await getStaff();
  const ids = new Set(bookings.map((b) => b.staffId));
  return staff.filter((m) => ids.has(m.id) && m.email).map((m) => m.email!);
}

export async function bookAction(
  _prev: BookState,
  formData: FormData,
): Promise<BookState> {
  const draft = readBookingForm(formData);
  const invalid = await validateDraft(draft);
  if (invalid) return { status: "error", message: invalid };

  // validateDraft мастер, үйлчилгээ/багцыг аль хэдийн шалгасан.
  const [itemName, staffName] = await Promise.all([
    draftItemName(draft),
    draftStaffNames(draft),
  ]);

  let bookings: Booking[];
  try {
    bookings = await placeDraftBookings(draft, "pending");
  } catch (e) {
    // Race safety net: the DB unique index rejected a slot taken microseconds ago.
    if ((e as Error).message === "SLOT_TAKEN") {
      return {
        status: "error",
        message: "Уучлаарай, энэ цаг дөнгөж захиалагдлаа. Өөр цаг сонгоно уу.",
      };
    }
    // Захиалгын код дараалан давхцав — маш ховор, дахин илгээхэд арилна.
    if ((e as Error).message === "CODE_EXHAUSTED") {
      return {
        status: "error",
        message: "Захиалга бүртгэхэд түр саатал гарлаа. Дахин илгээнэ үү.",
      };
    }
    throw e;
  }
  const booking = bookings[0];
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");

  // Notify admin(s) and the assigned staff members by email (no-ops if unset).
  const [{ salonName }, staffEmails] = await Promise.all([
    getSettings(),
    staffEmailsOf(bookings),
  ]);
  await sendEmail({
    to: Array.from(new Set([...notifyRecipients(), ...staffEmails])),
    subject: `Шинэ захиалга — ${itemName} (${formatDate(draft.date)} ${draft.time})`,
    html: newBookingEmail({
      salonName,
      service: itemName,
      staff: staffName,
      date: formatDate(draft.date),
      time: draft.time,
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      note: draft.note,
      // Имэйл дэх товчоор шууд шийднэ — админ сайт руу орох шаардлагагүй.
      // Хамт захиалсан үйлчилгээнүүд бүгд хамт баталгаажна/цуцлагдана.
      confirmUrl: bookingActionUrl(booking.id, "confirm"),
      cancelUrl: bookingActionUrl(booking.id, "cancel"),
    }),
  });

  return {
    status: "success",
    summary: {
      service: itemName,
      staff: staffName,
      date: draft.date,
      time: draft.time,
      code: booking.code,
      codes: bookings.map((b) => b.code),
      phone: draft.customerPhone,
    },
  };
}

/* ---------------- Урьдчилгаа төлбөр ---------------- */

export type StartPaymentState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "invoice";
      paymentId: string;
      amount: number;
      /** Туршилтын горим — бодит мөнгө хөдлөхгүй, гараар баталгаажуулна. */
      mock: boolean;
      qrText?: string;
      qrImage?: string;
      payUrl?: string;
      expiresAt: string;
    };

/**
 * Урьдчилгаатай захиалгын эхний алхам: цагийг шалгаад нэхэмжлэх үүсгэнэ.
 * Захиалга ЭНД үүсэхгүй — төлбөр баталгаажсаны дараа л үүснэ.
 */
export async function startBookingPaymentAction(
  _prev: StartPaymentState,
  formData: FormData,
): Promise<StartPaymentState> {
  const draft = readBookingForm(formData);
  const invalid = await validateDraft(draft);
  if (invalid) return { status: "error", message: invalid };

  const { depositAmount } = await getSettings();
  if (depositAmount <= 0) {
    return { status: "error", message: "Урьдчилгаа тохируулаагүй байна." };
  }

  const provider = resolveProvider();
  const payment = await createPayment({
    amount: depositAmount,
    provider: provider.name,
    draft,
  });

  try {
    const invoice = await provider.createInvoice({
      paymentId: payment.id,
      amount: depositAmount,
      description: `${await draftItemName(draft)} — ${formatDate(draft.date)} ${draft.time}`,
      callbackUrl: callbackUrl(),
    });
    await updatePayment(payment.id, { invoiceId: invoice.invoiceId });
    return {
      status: "invoice",
      paymentId: payment.id,
      amount: depositAmount,
      mock: isMockPayment(),
      qrText: invoice.qrText,
      qrImage: invoice.qrImage,
      payUrl: invoice.payUrl,
      expiresAt: payment.expiresAt,
    };
  } catch (e) {
    await updatePayment(payment.id, {
      status: "expired",
      error: (e as Error).message,
    });
    return {
      status: "error",
      message: "Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
    };
  }
}

export type PaymentProgress =
  | { state: "pending" }
  | { state: "paid"; code: string }
  | { state: "failed"; message: string };

/** Төлбөрийн явцыг шалгана — үйлчлүүлэгчийн дэлгэц үүгээр шинэчлэгдэнэ. */
export async function getPaymentProgressAction(
  paymentId: string,
): Promise<PaymentProgress> {
  const payment = await getPayment(paymentId);
  if (!payment) return { state: "failed", message: "Төлбөр олдсонгүй." };

  if (payment.status === "paid" && payment.bookingId) {
    const booking = await getBooking(payment.bookingId);
    return booking
      ? { state: "paid", code: booking.code }
      : { state: "failed", message: "Захиалга олдсонгүй." };
  }
  if (payment.status === "refund_due" || payment.status === "refunded") {
    return {
      state: "failed",
      message:
        "Уучлаарай, төлбөр хийгдэх хооронд энэ цаг завгүй болжээ. Төлбөрийг тань буцаана — салон тантай холбогдоно.",
    };
  }
  if (payment.status === "expired" || new Date(payment.expiresAt) < new Date()) {
    return {
      state: "failed",
      message: "Төлбөрийн хугацаа дууслаа. Захиалгаа дахин үүсгэнэ үү.",
    };
  }
  return { state: "pending" };
}

/**
 * Туршилтын горимд төлбөрийг гараар баталгаажуулна. Бодит систем холбогдсон
 * үед энэ үйлдэл ажиллахгүй — мөнгө хүлээж авалгүй захиалга үүсгэх боломжгүй.
 */
export async function mockPayAction(paymentId: string): Promise<PaymentProgress> {
  if (!isMockPayment()) {
    return { state: "failed", message: "Энэ үйлдэл зөвхөн туршилтын горимд ажиллана." };
  }
  const result = await finalizePaidBooking(paymentId);
  if (!result.ok) return { state: "failed", message: result.message };
  revalidatePath("/admin/bookings");
  revalidatePath("/portal");
  return { state: "paid", code: result.booking.code };
}

/** Админ буцаалт хийснээ тэмдэглэнэ (мөнгө нь банкаар гараар буцаана). */
export async function markRefundedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await updatePayment(String(formData.get("id") ?? ""), { status: "refunded" });
  revalidatePath("/admin/payments");
}

/* ---------------- Customer: "Миний захиалга" ---------------- */

/** Цагаас хэдэн цагийн өмнө хүртэл үйлчлүүлэгч өөрөө цуцалж болох вэ. */
const CANCEL_CUTOFF_HOURS = 2;

function startsAt(booking: { date: string; time: string }): number {
  return salonInstant(booking.date, booking.time);
}

function isCancellable(booking: Booking): boolean {
  if (booking.status !== "pending" && booking.status !== "confirmed") return false;
  const start = startsAt(booking);
  if (Number.isNaN(start)) return false;
  return start - Date.now() > CANCEL_CUTOFF_HOURS * 60 * 60 * 1000;
}

/** Дотоод захиалгыг үйлчлүүлэгчид үзүүлэх аюулгүй хэлбэрт хөрвүүлнэ. */
async function toMyBooking(booking: Booking): Promise<MyBooking> {
  const staff = await getStaffMember(booking.staffId);

  // Багц захиалга бол багцын нэр/үнэ/хугацааг тооцно.
  if (booking.packageId) {
    const pkg = await getPackage(booking.packageId);
    const durationMin = pkg ? await getPackageDuration(pkg) : 0;
    return {
      code: booking.code,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerName: booking.customerName,
      serviceName: pkg ? `${pkg.name} (багц)` : "Багц",
      serviceEmoji: pkg?.emoji ?? "🎁",
      staffName: staff?.name ?? "—",
      price: pkg?.price ?? 0,
      durationMin,
      cancellable: isCancellable(booking),
    };
  }

  const service = await getService(booking.serviceId);
  return {
    code: booking.code,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    customerName: booking.customerName,
    serviceName: service?.name ?? "—",
    serviceEmoji: service?.emoji ?? "✨",
    staffName: staff?.name ?? "—",
    price: service ? effectivePrice(service) : 0,
    durationMin: service?.durationMin ?? 0,
    cancellable: isCancellable(booking),
  };
}

/** Нэг захиалгыг код + утсаар хайна. Олдоогүй бол null. */
export async function findMyBookingAction(
  code: string,
  phone: string,
): Promise<MyBooking | null> {
  const booking = await getBookingByCodeAndPhone(code, phone);
  return booking ? toMyBooking(booking) : null;
}

/**
 * Төхөөрөмжид хадгалагдсан хэд хэдэн код/утсыг нэг дор шалгана.
 * Олдоогүйг нь чимээгүй алгасаад, огноогоор нь эрэмбэлж буцаана.
 */
export async function listMyBookingsAction(
  entries: { code: string; phone: string }[],
): Promise<MyBooking[]> {
  const found = await Promise.all(
    entries.slice(0, 20).map((e) => getBookingByCodeAndPhone(e.code, e.phone)),
  );
  const bookings = await Promise.all(
    found.filter((b): b is Booking => Boolean(b)).map(toMyBooking),
  );
  return bookings.sort((a, b) => startsAt(b) - startsAt(a));
}

export type CancelResult = { ok: boolean; message: string };

/** Үйлчлүүлэгч өөрийн захиалгаа цуцална (код + утсаар баталгаажуулна). */
export async function cancelMyBookingAction(
  code: string,
  phone: string,
): Promise<CancelResult> {
  const booking = await getBookingByCodeAndPhone(code, phone);
  if (!booking) {
    return { ok: false, message: "Захиалга олдсонгүй. Код болон дугаараа шалгана уу." };
  }
  if (booking.status === "cancelled") {
    return { ok: false, message: "Энэ захиалга аль хэдийн цуцлагдсан байна." };
  }
  if (!isCancellable(booking)) {
    return {
      ok: false,
      message: `Цагаас ${CANCEL_CUTOFF_HOURS} цагийн өмнөөс эхлэн онлайнаар цуцлах боломжгүй. Утсаар холбогдоно уу.`,
    };
  }

  await updateBookingStatus(booking.id, "cancelled");
  revalidatePath("/admin/bookings");
  revalidatePath("/portal");
  await notifyCancellation(booking, "customer");
  return { ok: true, message: "Захиалга цуцлагдлаа." };
}

/* ---------------- Admin: services ---------------- */

function parsePrice(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Үнэ/хямдрал өөрчлөгдөхөд үүнийг харуулдаг бүх хуудсыг шинэчилнэ. */
function revalidateServices(): void {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/book");
  revalidatePath("/");
}

/** Хямдралын хувь: "Хямдралтай" тэмдэглээгүй бол үргэлж 0. */
function parseSalePercent(formData: FormData): number {
  if (formData.get("onSale") === null) return 0;
  return normalizeSalePercent(parsePrice(formData.get("salePercent")));
}

/**
 * Формоос зургийг шийднэ: шинэ файл давуу эрхтэй, байхгүй бол хуучнаа хадгална
 * ("устгах" тэмдэглээгүй бол). Солигдсон/устсан хуучин файлыг цэвэрлэнэ.
 */
async function resolveImage(
  formData: FormData,
  currentUrl?: string,
): Promise<string | undefined> {
  const uploaded = await saveImage(formData.get("image"));
  const removed = formData.get("removeImage") !== null;
  let next = currentUrl;
  if (removed) next = undefined;
  if (uploaded) next = uploaded;
  if (currentUrl && currentUrl !== next) await deleteImage(currentUrl);
  return next;
}

export async function createServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const imageUrl = (await saveImage(formData.get("image"))) ?? undefined;
  await createService({
    name: String(formData.get("name") ?? "").trim() || "Нэргүй үйлчилгээ",
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || "Бусад",
    durationMin: parsePrice(formData.get("durationMin")) || 60,
    price: parsePrice(formData.get("price")),
    salePercent: parseSalePercent(formData),
    emoji: String(formData.get("emoji") ?? "").trim() || "✨",
    imageUrl,
    active: formData.get("active") !== null,
  });
  revalidateServices();
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = await getService(id);
  const imageUrl = await resolveImage(formData, current?.imageUrl);
  await updateService(id, {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    durationMin: parsePrice(formData.get("durationMin")) || 60,
    price: parsePrice(formData.get("price")),
    salePercent: parseSalePercent(formData),
    emoji: String(formData.get("emoji") ?? "").trim() || "✨",
    imageUrl,
    active: formData.get("active") !== null,
  });
  revalidateServices();
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = await getService(id);
  await deleteService(id);
  await deleteImage(current?.imageUrl);
  revalidateServices();
}

/* ---------------- Admin: staff ---------------- */

/** Create/update a Supabase login for a staff member when email+password given. */
async function maybeSetStaffLogin(email: string, password: string): Promise<string | null> {
  if (!email || !password) return null;
  if (!isAdminApiConfigured()) {
    return "Нэвтрэх эрх үүсгэхийн тулд Supabase-ийн SUPABASE_SECRET_KEY болон URL хэрэгтэй.";
  }
  try {
    await upsertStaffAuthUser(email, password);
    return null;
  } catch (e) {
    return `Нэвтрэх эрх үүсгэхэд алдаа гарлаа: ${(e as Error).message}`;
  }
}

export async function createStaffAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const imageUrl = (await saveImage(formData.get("image"))) ?? undefined;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  await createStaff({
    name: String(formData.get("name") ?? "").trim() || "Нэргүй мастер",
    title: String(formData.get("title") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    serviceIds: formData.getAll("serviceIds").map(String),
    emoji: String(formData.get("emoji") ?? "").trim() || "💇‍♀️",
    imageUrl,
    email: email || undefined,
    locationId: String(formData.get("locationId") ?? "").trim() || undefined,
    active: formData.get("active") !== null,
  });
  await maybeSetStaffLogin(email, password);
  revalidatePath("/admin/staff");
  revalidatePath("/staff");
}

export async function updateStaffAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = await getStaffMember(id);

  const imageUrl = await resolveImage(formData, current?.imageUrl);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  await updateStaff(id, {
    name: String(formData.get("name") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    serviceIds: formData.getAll("serviceIds").map(String),
    emoji: String(formData.get("emoji") ?? "").trim() || "💇‍♀️",
    imageUrl,
    email: email || undefined,
    locationId: String(formData.get("locationId") ?? "").trim() || undefined,
    active: formData.get("active") !== null,
  });
  await maybeSetStaffLogin(email, password);
  revalidatePath("/admin/staff");
  revalidatePath("/staff");
}

export async function deleteStaffAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = await getStaffMember(id);
  await deleteStaff(id);
  await deleteImage(current?.imageUrl);
  revalidatePath("/admin/staff");
  revalidatePath("/staff");
}

/* ---------------- Admin: bookings ---------------- */

export async function setBookingStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  await updateBookingStatus(id, status);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/portal");
}

/**
 * Хуанлийн check — тэмдэглэсэн бол баталгаажсан, авсан бол хүлээгдэж буй.
 * Зөвхөн энэ хоёр төлөвийн хооронд сэлгэнэ: дууссан, ирээгүй, цуцлагдсан
 * захиалгыг санамсаргүй дарж буцаахгүй.
 */
export async function setBookingConfirmedAction(
  id: string,
  confirmed: boolean,
): Promise<void> {
  await requireAdmin();
  const booking = await getBooking(id);
  if (!booking || (booking.status !== "pending" && booking.status !== "confirmed")) return;
  await updateBookingStatus(id, confirmed ? "confirmed" : "pending");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
  revalidatePath("/portal");
}

export type EditBookingState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; at: number };

/**
 * Баталгаажаагүй захиалгыг засна: үйлчилгээ, мастер (өөр хүн рүү шилжүүлэх),
 * огноо, цаг, үйлчлүүлэгчийн мэдээлэл. Баталгаажсаныг (check-тэй) бүрэн
 * засахгүй — зөвхөн өөр мастер руу шилжүүлж болно (`adminMoveBookingAction`).
 * Ингэснээр үйлчлүүлэгчтэй тохирсон цагийг андуурч хөдөлгөхгүй.
 */
export async function adminUpdateBookingAction(
  _prev: EditBookingState,
  formData: FormData,
): Promise<EditBookingState> {
  await requireAdmin();
  const booking = await getBooking(String(formData.get("id") ?? ""));
  if (!booking) return { status: "error", message: "Захиалга олдсонгүй." };
  if (booking.status !== "pending") {
    return {
      status: "error",
      message: "Баталгаажсан захиалгыг засахын өмнө check-ийг нь авна уу.",
    };
  }

  const item = String(formData.get("item") ?? "");
  return applyBookingEdit(booking, {
    serviceId: item.startsWith("svc:") ? item.slice(4) : "",
    packageId: item.startsWith("pkg:") ? item.slice(4) : "",
    staffId: String(formData.get("staffId") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? "").slice(0, 5),
    customerName: String(formData.get("customerName") ?? "").trim(),
    customerPhone: String(formData.get("customerPhone") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
  });
}

/**
 * Захиалгыг өөр мастер руу шилжүүлнэ — check-тэй (баталгаажсан) байсан ч
 * болно, бусад талбар өөрчлөгдөхгүй. ⭐-тэй захиалгыг шилжүүлэхгүй.
 */
export async function adminMoveBookingAction(
  _prev: EditBookingState,
  formData: FormData,
): Promise<EditBookingState> {
  await requireAdmin();
  const booking = await getBooking(String(formData.get("id") ?? ""));
  if (!booking) return { status: "error", message: "Захиалга олдсонгүй." };
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return { status: "error", message: "Энэ захиалгыг шилжүүлэх боломжгүй." };
  }
  return applyBookingEdit(booking, {
    serviceId: booking.serviceId,
    packageId: booking.packageId ?? "",
    staffId: String(formData.get("staffId") ?? ""),
    date: booking.date,
    time: booking.time,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    note: booking.note,
  });
}

/**
 * ⭐ — "зөвхөн энэ мастер дээр үйлчлүүлнэ" гэсэн үйлчлүүлэгч. Одтой захиалгыг
 * өөр мастер руу шилжүүлэхгүй. Алдаа гарвал мессежийг буцаана.
 */
export async function setBookingStaffLockedAction(
  id: string,
  locked: boolean,
): Promise<string | null> {
  await requireAdmin();
  try {
    await updateBookingStaffLocked(id, locked);
  } catch (e) {
    return (e as Error).message;
  }
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
  return null;
}

/**
 * Засварыг шалгаад бичнэ — бүрэн засвар ба шилжүүлэлт хоёулаа үүгээр явна.
 * Админ ажлын цагаас гадуур ч оруулж болно (утсаар тохирсон онцгой цаг),
 * харин ⭐-тэй захиалгын мастерыг солих, мастерын өөр захиалгатай давхцахыг
 * зөвшөөрөхгүй.
 */
async function applyBookingEdit(
  booking: Booking,
  fields: {
    serviceId: string;
    packageId: string;
    staffId: string;
    date: string;
    time: string;
    customerName: string;
    customerPhone: string;
    note: string;
  },
): Promise<EditBookingState> {
  const { id } = booking;
  const { serviceId, packageId, staffId, date, time, customerName, customerPhone, note } =
    fields;

  if (booking.staffLocked && staffId !== booking.staffId) {
    const current = await getStaffMember(booking.staffId);
    return {
      status: "error",
      message: `⭐ Энэ үйлчлүүлэгч зөвхөн ${current?.name ?? "одоогийн мастер"} дээр үйлчлүүлнэ. Шилжүүлэх бол эхлээд одыг авна уу.`,
    };
  }
  if ((!serviceId && !packageId) || !staffId) {
    return { status: "error", message: "Үйлчилгээ, мастерыг сонгоно уу." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { status: "error", message: "Огноо, цагийг зөв оруулна уу." };
  }
  if (customerName.length < 2) return { status: "error", message: "Нэрээ оруулна уу." };
  if (!/^[0-9\s+\-()]{6,}$/.test(customerPhone)) {
    return { status: "error", message: "Утасны дугаараа зөв оруулна уу." };
  }

  const staff = await getStaffMember(staffId);
  if (!staff || !staff.active) return { status: "error", message: "Мастер олдсонгүй." };

  let durationMin: number;
  if (packageId) {
    const pkg = await getPackage(packageId);
    if (!pkg) return { status: "error", message: "Багц олдсонгүй." };
    durationMin = await getPackageDuration(pkg);
  } else {
    const service = await getService(serviceId);
    if (!service) return { status: "error", message: "Үйлчилгээ олдсонгүй." };
    if (staff.serviceIds.length > 0 && !staff.serviceIds.includes(serviceId)) {
      return { status: "error", message: `${staff.name} энэ үйлчилгээг хийдэггүй.` };
    }
    durationMin = service.durationMin;
  }

  if (await hasBookingConflict(staffId, date, time, durationMin, id)) {
    return {
      status: "error",
      message: `${staff.name} энэ хугацаанд өөр захиалгатай байна. Өөр цаг эсвэл мастер сонгоно уу.`,
    };
  }

  try {
    await updateBooking(id, {
      serviceId: packageId ? "" : serviceId,
      packageId: packageId || undefined,
      staffId,
      date,
      time,
      customerName,
      customerPhone,
      note,
      locationId: staff.locationId || booking.locationId,
    });
  } catch (e) {
    if ((e as Error).message === "SLOT_TAKEN") {
      return {
        status: "error",
        message: `${staff.name}-д яг энэ цагт өөр захиалга бүртгэгдсэн байна.`,
      };
    }
    throw e;
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
  revalidatePath("/portal");
  return { status: "success", at: Date.now() };
}

/**
 * Имэйлийн товчоор захиалгыг баталгаажуулах/цуцлах.
 *
 * Нэвтрэх шаардлагагүй — эрхийг гарын үсэгтэй холбоос өөрөө нотолно
 * (`booking-token.ts`). Тиймээс энд `requireAdmin()` дуудахгүй, харин токеныг
 * ДАХИН шалгана: хуудас нээгдсэнээс хойш хугацаа нь дуусаж болно.
 */
export async function emailBookingActionAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const parsed = readBookingAction(token);
  if (!parsed) return;

  const booking = await getBooking(parsed.id);
  if (!booking) return;

  // Хамт захиалсан үйлчилгээнүүд нэг айлчлал тул хамт шийдэгдэнэ. Аль
  // хэдийн цуцлагдсан/дууссаныг хөндөхгүй.
  const group = booking.groupId ? await getBookingGroup(booking.groupId) : [];
  const targets = (group.length > 0 ? group : [booking]).filter(
    (b) => b.id === booking.id || b.status === "pending" || b.status === "confirmed",
  );
  for (const b of targets) {
    await updateBookingStatus(b.id, parsed.action === "confirm" ? "confirmed" : "cancelled");
  }
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/portal");
  revalidatePath(`/confirm/${token}`);
}

/**
 * Захиалгын төлбөрийг гараар бүртгэнэ.
 *
 * Салонд бодит байдал: үйлчлүүлэгч урьдчилгаагаа бэлнээр эсвэл дансаар өгдөг,
 * үйлчилгээний явцад нэмэлт зүйл (урт үс, нэмэлт бодис) гарч үнэ өөрчлөгддөг.
 * Тиймээс энэ хоёр дүнг админ өөрөө бичиж, үлдэгдлийг систем бодно.
 */
export async function setBookingAmountsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  // Хоосон, сөрөг, бутархай утгыг цэгцэлнэ — мөнгө бүхэл тоо.
  const amount = Math.max(0, Math.round(Number(formData.get("amount")) || 0));

  if (field === "deposit") await updateBookingAmounts(id, { depositPaid: amount });
  else if (field === "extra") await updateBookingAmounts(id, { extraCharge: amount });

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}

export async function deleteBookingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteBooking(String(formData.get("id") ?? ""));
  revalidatePath("/admin/bookings");
}

export type AdminBookState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; code: string; summary: string };

/**
 * Админ өөрөө захиалга бүртгэнэ — утсаар залгасан үйлчлүүлэгчид зориулав.
 * Захиалгын кодыг буцаана: админ утсаар уншиж өгөх ёстой.
 *
 * "Хуваариас гадуур" тэмдэглэвэл ажлын цаг/сул цагийн шалгалтыг алгасана
 * (онцгой тохиолдолд шургуулж оруулах). Нэг мастерын яг нэг цагт хоёр
 * захиалга орохоос мэдээллийн сангийн индекс хамгаална.
 */
export async function adminCreateBookingAction(
  _prev: AdminBookState,
  formData: FormData,
): Promise<AdminBookState> {
  await requireAdmin();

  const draft = readBookingForm(formData);
  const ignoreHours = formData.get("ignoreHours") !== null;
  const confirmNow = formData.get("confirmNow") !== null;

  // «Хуваариас гадуур» тэмдэглэвэл ажлын цаг/сул цагийн шалгалтыг алгасна.
  const invalid = await validateDraft(draft, { checkAvailability: !ignoreHours });
  if (invalid) {
    return {
      status: "error",
      message: ignoreHours
        ? invalid
        : `${invalid} Шаардлагатай бол «Хуваариас гадуур» тэмдэглэнэ үү.`,
    };
  }

  const [itemName, staffName] = await Promise.all([
    draftItemName(draft),
    draftStaffNames(draft),
  ]);

  let bookings: Booking[];
  try {
    bookings = await placeDraftBookings(draft, confirmNow ? "confirmed" : "pending");
  } catch (e) {
    const message = (e as Error).message;
    if (message === "SLOT_TAKEN") {
      return {
        status: "error",
        message: "Энэ мастерын тухайн цагт өөр захиалга бүртгэгдсэн байна.",
      };
    }
    if (message === "CODE_EXHAUSTED") {
      return { status: "error", message: "Түр саатал гарлаа. Дахин оролдоно уу." };
    }
    throw e;
  }
  const booking = bookings[0];

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/portal");

  // Мастерт нь мэдэгдэнэ. Админд илгээхгүй — өөрөө бүртгэсэн тул.
  const staffEmails = await staffEmailsOf(bookings);
  if (staffEmails.length > 0) {
    const { salonName } = await getSettings();
    await sendEmail({
      to: staffEmails,
      subject: `Шинэ захиалга — ${itemName} (${formatDate(draft.date)} ${draft.time})`,
      html: newBookingEmail({
        salonName,
        service: itemName,
        staff: staffName,
        date: formatDate(draft.date),
        time: draft.time,
        customerName: draft.customerName,
        customerPhone: draft.customerPhone,
        note: draft.note,
        confirmUrl: bookingActionUrl(booking.id, "confirm"),
        cancelUrl: bookingActionUrl(booking.id, "cancel"),
      }),
    });
  }

  return {
    status: "success",
    code: bookings.map((b) => b.code).join(" · "),
    summary: `${itemName} · ${staffName} · ${formatDate(draft.date)} ${draft.time}`,
  };
}

/* ---------------- Staff portal ---------------- */

/** A staff member updates the status of one of THEIR OWN bookings. */
export async function staffSetBookingStatusAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "staff") throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  const allowed: BookingStatus[] = ["confirmed", "done", "no_show", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Invalid status");

  const booking = await getBooking(id);
  if (!booking || booking.staffId !== session.staffId) {
    throw new Error("Unauthorized"); // can only touch their own bookings
  }

  await updateBookingStatus(id, status);
  // Мастер цагаа цуцалбал админд мэдэгдэнэ — хуваарь өөрчлөгдсөнийг мэдэх нь чухал.
  if (status === "cancelled") await notifyCancellation(booking, "staff");
  revalidatePath("/portal");
  revalidatePath("/admin/bookings");
}

/* ---------------- Admin: reviews ---------------- */

export async function createReviewAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const rating = Number(formData.get("rating"));
  await createReview({
    customerName: String(formData.get("customerName") ?? "").trim() || "Үйлчлүүлэгч",
    rating: rating >= 1 && rating <= 5 ? rating : 5,
    text: String(formData.get("text") ?? "").trim(),
    active: formData.get("active") !== null,
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function updateReviewAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const rating = Number(formData.get("rating"));
  await updateReview(id, {
    customerName: String(formData.get("customerName") ?? "").trim(),
    rating: rating >= 1 && rating <= 5 ? rating : 5,
    text: String(formData.get("text") ?? "").trim(),
    active: formData.get("active") !== null,
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteReview(String(formData.get("id") ?? ""));
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

/* ---------------- Admin: settings ---------------- */

function normTime(v: FormDataEntryValue | null, fallback: string): string {
  const s = String(v ?? "").trim();
  return /^\d{2}:\d{2}$/.test(s) ? s : fallback;
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const text = (key: string, max: number) =>
    String(formData.get(key) ?? "").trim().slice(0, max);

  const current = await getSettings();

  // Зөвхөн салон даяарх ерөнхий мэдээллийг эндээс засна. Хаяг, утас, ажлын цаг
  // нь салбар бүрт хамаарах тул "Салбарууд" хуудаснаас засагдана.
  const patch: Partial<Settings> = {
    // Нэр хоосон үлдвэл сайт нэргүй болох тул анхны утгаараа үлдээнэ.
    salonName: text("salonName", 60) || "Lumière",
    tagline: text("tagline", 80),
    email: text("email", 80),
    about: text("about", 1000),
    heroImageUrl: await resolveImage(formData, current.heroImageUrl),
    // Урьдчилгаа: 0 = авахгүй. Хэт өндөр дүнгээс хамгаалж дээд хязгаартай.
    depositAmount: Math.min(1_000_000, Math.max(0, parsePrice(formData.get("depositAmount")))),
  };
  await updateSettings(patch);

  // Салоны мэдээлэл сайт даяар харагддаг тул бүх нийтийн хуудсыг шинэчилнэ.
  revalidatePath("/", "layout");
}

/* ---------------- Admin: locations (салбарууд) ---------------- */

const SLOT_VALUES = [15, 20, 30, 45, 60];

function parseClosedDays(formData: FormData): number[] {
  return formData
    .getAll("closedDays")
    .map((d) => Number(d))
    .filter((n) => n >= 0 && n <= 6);
}

/** Салбарын формоос талбаруудыг цэгцэлж, хаягаас координатыг олно. */
async function readLocationFields(
  formData: FormData,
  currentAddress?: string,
  currentCoords?: string,
): Promise<Omit<Location, "id">> {
  const text = (key: string, max: number) =>
    String(formData.get(key) ?? "").trim().slice(0, max);
  const slot = Number(formData.get("slotMinutes"));
  const address = text("address", 200);

  // Хаяг өөрчлөгдөөгүй бөгөөд өмнө нь координат олдсон бол дахин хайхгүй.
  const mapCoords =
    address === currentAddress && currentCoords
      ? currentCoords
      : await geocodeAddress(address);

  return {
    name: text("name", 60),
    address,
    phone: text("phone", 40),
    mapCoords,
    openTime: normTime(formData.get("openTime"), "10:00"),
    closeTime: normTime(formData.get("closeTime"), "20:00"),
    slotMinutes: SLOT_VALUES.includes(slot) ? slot : 30,
    closedDays: parseClosedDays(formData),
    sortOrder: Number(formData.get("sortOrder")) || 0,
    active: formData.get("active") !== null,
  };
}

function revalidateLocations(): void {
  revalidatePath("/admin/locations");
  revalidatePath("/admin/staff");
  revalidatePath("/", "layout");
  revalidatePath("/book");
  revalidatePath("/staff");
}

export async function createLocationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await createLocation(await readLocationFields(formData));
  revalidateLocations();
}

export async function updateLocationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = await getLocation(id);
  await updateLocation(
    id,
    await readLocationFields(formData, current?.address, current?.mapCoords),
  );
  revalidateLocations();
}

export async function deleteLocationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteLocation(String(formData.get("id") ?? ""));
  revalidateLocations();
}

/* ---------------- Admin: packages (багц) ---------------- */

function revalidatePackages(): void {
  // Багц одоо админы «Үйлчилгээ» хуудасны нэг таб — тэр хуудсыг шинэчилнэ.
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/book");
  revalidatePath("/");
}

function readPackageFields(formData: FormData): Omit<ServicePackage, "id"> {
  return {
    name: String(formData.get("name") ?? "").trim() || "Нэргүй багц",
    description: String(formData.get("description") ?? "").trim().slice(0, 500),
    serviceIds: formData.getAll("serviceIds").map(String),
    price: parsePrice(formData.get("price")),
    emoji: String(formData.get("emoji") ?? "").trim() || "🎁",
    sortOrder: Number(formData.get("sortOrder")) || 0,
    active: formData.get("active") !== null,
  };
}

export async function createPackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await createPackage(readPackageFields(formData));
  revalidatePackages();
}

export async function updatePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updatePackage(id, readPackageFields(formData));
  revalidatePackages();
}

export async function deletePackageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deletePackage(String(formData.get("id") ?? ""));
  revalidatePackages();
}
