"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, isAdmin, signOut } from "./auth";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { isAdminApiConfigured, upsertStaffAuthUser } from "./supabase/admin";
import {
  createBooking,
  createReview,
  createService,
  createStaff,
  deleteBooking,
  deleteReview,
  deleteService,
  deleteStaff,
  getAvailableSlots,
  getBooking,
  getBookingByCodeAndPhone,
  getService,
  getSettings,
  getStaffForService,
  getStaffMember,
  updateBookingStatus,
  updateReview,
  updateService,
  updateSettings,
  updateStaff,
} from "./db";
import { deleteImage, saveImage } from "./upload";
import { geocodeAddress } from "./geocode";
import { newBookingEmail, sendEmail } from "./email";
import { effectivePrice, formatDate, normalizeSalePercent } from "./format";
import { salonInstant } from "./time";
import type { Booking, BookingStatus, MyBooking, Settings } from "./types";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
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

/* ---------------- Public booking ---------------- */

/** Available HH:mm start times for the picker (respects hours, duration, bookings). */
export async function getAvailableSlotsAction(
  serviceId: string,
  staffId: string,
  date: string,
): Promise<string[]> {
  if (!serviceId || !staffId || !date) return [];
  return getAvailableSlots(serviceId, staffId, date);
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
        phone: string;
      };
    };

export async function bookAction(
  _prev: BookState,
  formData: FormData,
): Promise<BookState> {
  const serviceId = String(formData.get("serviceId") ?? "");
  const staffId = String(formData.get("staffId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!serviceId || !staffId || !date || !time) {
    return { status: "error", message: "Үйлчилгээ, мастер, огноо, цагийг бүрэн сонгоно уу." };
  }
  if (customerName.length < 2) {
    return { status: "error", message: "Нэрээ оруулна уу." };
  }
  if (!/^[0-9\s+\-()]{6,}$/.test(customerPhone)) {
    return { status: "error", message: "Утасны дугаараа зөв оруулна уу." };
  }

  const service = await getService(serviceId);
  const staffList = await getStaffForService(serviceId);
  const staff = staffList.find((s) => s.id === staffId);
  if (!service || !staff) {
    return { status: "error", message: "Сонгосон үйлчилгээ эсвэл мастер олдсонгүй." };
  }

  // Re-validate on the server: the slot must still be genuinely available
  // (not booked, within hours, not in the past).
  const available = await getAvailableSlots(serviceId, staffId, date);
  if (!available.includes(time)) {
    return {
      status: "error",
      message: "Уучлаарай, энэ цаг боломжгүй болсон байна. Өөр цаг сонгоно уу.",
    };
  }

  let booking;
  try {
    booking = await createBooking({
      serviceId,
      staffId,
      date,
      time,
      customerName,
      customerPhone,
      note,
    });
  } catch (e) {
    // Race safety net: the DB unique index rejected a slot taken microseconds ago.
    if ((e as Error).message === "SLOT_TAKEN") {
      return {
        status: "error",
        message: "Уучлаарай, энэ цаг дөнгөж захиалагдлаа. Өөр цаг сонгоно уу.",
      };
    }
    throw e;
  }
  revalidatePath("/admin/bookings");

  // Notify admin(s) and the assigned staff member by email (no-ops if unset).
  const adminList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const recipients = Array.from(new Set([...adminList, ...(staff.email ? [staff.email] : [])]));
  const { salonName } = await getSettings();
  await sendEmail({
    to: recipients,
    subject: `Шинэ захиалга — ${service.name} (${formatDate(date)} ${time})`,
    html: newBookingEmail({
      salonName,
      service: service.name,
      staff: staff.name,
      date: formatDate(date),
      time,
      customerName,
      customerPhone,
      note,
    }),
  });

  return {
    status: "success",
    summary: {
      service: service.name,
      staff: staff.name,
      date,
      time,
      code: booking.code,
      phone: customerPhone,
    },
  };
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
  const [service, staff] = await Promise.all([
    getService(booking.serviceId),
    getStaffMember(booking.staffId),
  ]);
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

export async function createServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await createService({
    name: String(formData.get("name") ?? "").trim() || "Нэргүй үйлчилгээ",
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || "Бусад",
    durationMin: parsePrice(formData.get("durationMin")) || 60,
    price: parsePrice(formData.get("price")),
    salePercent: parseSalePercent(formData),
    emoji: String(formData.get("emoji") ?? "").trim() || "✨",
    active: formData.get("active") !== null,
  });
  revalidateServices();
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updateService(id, {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    durationMin: parsePrice(formData.get("durationMin")) || 60,
    price: parsePrice(formData.get("price")),
    salePercent: parseSalePercent(formData),
    emoji: String(formData.get("emoji") ?? "").trim() || "✨",
    active: formData.get("active") !== null,
  });
  revalidateServices();
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteService(String(formData.get("id") ?? ""));
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

  // Resolve the photo: new upload wins; else keep existing unless "remove" ticked.
  const uploaded = await saveImage(formData.get("image"));
  const removeImage = formData.get("removeImage") !== null;
  let imageUrl = current?.imageUrl;
  if (removeImage) imageUrl = undefined;
  if (uploaded) imageUrl = uploaded;

  // Clean up the old file if it was replaced or removed.
  if (current?.imageUrl && current.imageUrl !== imageUrl) {
    await deleteImage(current.imageUrl);
  }

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
}

export async function deleteBookingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteBooking(String(formData.get("id") ?? ""));
  revalidatePath("/admin/bookings");
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
  const slot = Number(formData.get("slotMinutes"));
  const text = (key: string, max: number) =>
    String(formData.get(key) ?? "").trim().slice(0, max);

  // Газрын зургийн координатыг хаягаас өөрөө олно. Хаяг өөрчлөгдөөгүй бөгөөд
  // өмнө нь олдсон байвал дахин хайхгүй.
  const address = text("address", 200);
  const current = await getSettings();
  const mapCoords =
    address === current.address && current.mapCoords
      ? current.mapCoords
      : await geocodeAddress(address);

  const patch: Partial<Settings> = {
    openTime: normTime(formData.get("openTime"), "10:00"),
    closeTime: normTime(formData.get("closeTime"), "20:00"),
    slotMinutes: [15, 20, 30, 45, 60].includes(slot) ? slot : 30,
    closedDays: formData
      .getAll("closedDays")
      .map((d) => Number(d))
      .filter((n) => n >= 0 && n <= 6),
    // Нэр хоосон үлдвэл сайт нэргүй болох тул анхны утгаараа үлдээнэ.
    salonName: text("salonName", 60) || "Lumière",
    tagline: text("tagline", 80),
    phone: text("phone", 40),
    email: text("email", 80),
    address,
    about: text("about", 1000),
    mapCoords,
  };
  await updateSettings(patch);

  // Салоны мэдээлэл сайт даяар харагддаг тул бүх нийтийн хуудсыг шинэчилнэ.
  revalidatePath("/", "layout");
}
