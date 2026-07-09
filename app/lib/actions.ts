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
  getService,
  getStaffForService,
  getStaffMember,
  updateBookingStatus,
  updateReview,
  updateService,
  updateSettings,
  updateStaff,
} from "./db";
import { deleteImage, saveImage } from "./upload";
import { newBookingEmail, sendEmail } from "./email";
import { formatDate } from "./format";
import type { BookingStatus, Settings } from "./types";

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
      summary: { service: string; staff: string; date: string; time: string };
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

  await createBooking({ serviceId, staffId, date, time, customerName, customerPhone, note });
  revalidatePath("/admin/bookings");

  // Notify admin(s) and the assigned staff member by email (no-ops if unset).
  const adminList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const recipients = Array.from(new Set([...adminList, ...(staff.email ? [staff.email] : [])]));
  await sendEmail({
    to: recipients,
    subject: `Шинэ захиалга — ${service.name} (${formatDate(date)} ${time})`,
    html: newBookingEmail({
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
    summary: { service: service.name, staff: staff.name, date, time },
  };
}

/* ---------------- Admin: services ---------------- */

function parsePrice(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export async function createServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await createService({
    name: String(formData.get("name") ?? "").trim() || "Нэргүй үйлчилгээ",
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || "Бусад",
    durationMin: parsePrice(formData.get("durationMin")) || 60,
    price: parsePrice(formData.get("price")),
    emoji: String(formData.get("emoji") ?? "").trim() || "✨",
    active: formData.get("active") !== null,
  });
  revalidatePath("/admin/services");
  revalidatePath("/services");
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
    emoji: String(formData.get("emoji") ?? "").trim() || "✨",
    active: formData.get("active") !== null,
  });
  revalidatePath("/admin/services");
  revalidatePath("/services");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteService(String(formData.get("id") ?? ""));
  revalidatePath("/admin/services");
  revalidatePath("/services");
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
  const patch: Partial<Settings> = {
    openTime: normTime(formData.get("openTime"), "10:00"),
    closeTime: normTime(formData.get("closeTime"), "20:00"),
    slotMinutes: [15, 20, 30, 45, 60].includes(slot) ? slot : 30,
    closedDays: formData
      .getAll("closedDays")
      .map((d) => Number(d))
      .filter((n) => n >= 0 && n <= 6),
  };
  await updateSettings(patch);
  revalidatePath("/admin/settings");
  revalidatePath("/book");
}
