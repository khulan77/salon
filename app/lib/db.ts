import { randomUUID } from "crypto";
import { supabaseService } from "./supabase/service";
import type { Booking, Review, Service, Settings, Staff } from "./types";

const DEFAULT_SETTINGS: Settings = {
  openTime: "10:00",
  closeTime: "20:00",
  slotMinutes: 30,
  closedDays: [],
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const db = () => supabaseService();

/* ---------------- Mappers (snake_case row <-> camelCase type) ---------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
const serviceFromRow = (r: any): Service => ({
  id: r.id,
  name: r.name,
  description: r.description ?? "",
  category: r.category ?? "Бусад",
  durationMin: r.duration_min ?? 60,
  price: r.price ?? 0,
  emoji: r.emoji ?? "✨",
  active: r.active ?? true,
});
const serviceToRow = (s: Partial<Service>) => ({
  ...(s.name !== undefined && { name: s.name }),
  ...(s.description !== undefined && { description: s.description }),
  ...(s.category !== undefined && { category: s.category }),
  ...(s.durationMin !== undefined && { duration_min: s.durationMin }),
  ...(s.price !== undefined && { price: s.price }),
  ...(s.emoji !== undefined && { emoji: s.emoji }),
  ...(s.active !== undefined && { active: s.active }),
});

const staffFromRow = (r: any): Staff => ({
  id: r.id,
  name: r.name,
  title: r.title ?? "",
  bio: r.bio ?? "",
  serviceIds: r.service_ids ?? [],
  emoji: r.emoji ?? "💇‍♀️",
  imageUrl: r.image_url ?? undefined,
  email: r.email ?? undefined,
  active: r.active ?? true,
});
const staffToRow = (s: Partial<Staff>) => ({
  ...(s.name !== undefined && { name: s.name }),
  ...(s.title !== undefined && { title: s.title }),
  ...(s.bio !== undefined && { bio: s.bio }),
  ...(s.serviceIds !== undefined && { service_ids: s.serviceIds }),
  ...(s.emoji !== undefined && { emoji: s.emoji }),
  ...(s.imageUrl !== undefined && { image_url: s.imageUrl ?? null }),
  ...(s.email !== undefined && { email: s.email ?? null }),
  ...(s.active !== undefined && { active: s.active }),
});

const bookingFromRow = (r: any): Booking => ({
  id: r.id,
  serviceId: r.service_id,
  staffId: r.staff_id,
  date: r.date,
  time: r.time,
  customerName: r.customer_name,
  customerPhone: r.customer_phone,
  note: r.note ?? "",
  status: r.status,
  createdAt: r.created_at,
});

const reviewFromRow = (r: any): Review => ({
  id: r.id,
  customerName: r.customer_name,
  rating: r.rating ?? 5,
  text: r.text ?? "",
  active: r.active ?? true,
  createdAt: r.created_at,
});
const reviewToRow = (r: Partial<Review>) => ({
  ...(r.customerName !== undefined && { customer_name: r.customerName }),
  ...(r.rating !== undefined && { rating: r.rating }),
  ...(r.text !== undefined && { text: r.text }),
  ...(r.active !== undefined && { active: r.active }),
});

const settingsFromRow = (r: any): Settings => ({
  openTime: r.open_time ?? DEFAULT_SETTINGS.openTime,
  closeTime: r.close_time ?? DEFAULT_SETTINGS.closeTime,
  slotMinutes: r.slot_minutes ?? DEFAULT_SETTINGS.slotMinutes,
  closedDays: r.closed_days ?? [],
});
/* eslint-enable @typescript-eslint/no-explicit-any */

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ---------------- Services ---------------- */

export async function getServices(opts?: { activeOnly?: boolean }): Promise<Service[]> {
  let q = db().from("services").select("*").order("category").order("price");
  if (opts?.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  return must(data, error).map(serviceFromRow);
}

export async function getService(id: string): Promise<Service | undefined> {
  const { data } = await db().from("services").select("*").eq("id", id).maybeSingle();
  return data ? serviceFromRow(data) : undefined;
}

export async function createService(input: Omit<Service, "id">): Promise<Service> {
  const id = `svc-${randomUUID().slice(0, 8)}`;
  const { error } = await db().from("services").insert({ id, ...serviceToRow(input) });
  if (error) throw new Error(error.message);
  return { ...input, id };
}

export async function updateService(
  id: string,
  patch: Partial<Omit<Service, "id">>,
): Promise<void> {
  const { error } = await db().from("services").update(serviceToRow(patch)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await db().from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Staff ---------------- */

export async function getStaff(opts?: { activeOnly?: boolean }): Promise<Staff[]> {
  let q = db().from("staff").select("*").order("name");
  if (opts?.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  return must(data, error).map(staffFromRow);
}

export async function getStaffMember(id: string): Promise<Staff | undefined> {
  const { data } = await db().from("staff").select("*").eq("id", id).maybeSingle();
  return data ? staffFromRow(data) : undefined;
}

export async function getStaffByEmail(email: string): Promise<Staff | undefined> {
  const { data } = await db()
    .from("staff")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  return data ? staffFromRow(data) : undefined;
}

export async function getStaffForService(serviceId: string): Promise<Staff[]> {
  const all = await getStaff({ activeOnly: true });
  return all.filter((s) => s.serviceIds.length === 0 || s.serviceIds.includes(serviceId));
}

export async function createStaff(input: Omit<Staff, "id">): Promise<Staff> {
  const id = `stf-${randomUUID().slice(0, 8)}`;
  const { error } = await db().from("staff").insert({ id, ...staffToRow(input) });
  if (error) throw new Error(error.message);
  return { ...input, id };
}

export async function updateStaff(
  id: string,
  patch: Partial<Omit<Staff, "id">>,
): Promise<void> {
  const { error } = await db().from("staff").update(staffToRow(patch)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStaff(id: string): Promise<void> {
  const { error } = await db().from("staff").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Bookings ---------------- */

export async function getBookings(): Promise<Booking[]> {
  const { data, error } = await db()
    .from("bookings")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });
  return must(data, error).map(bookingFromRow);
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const { data } = await db().from("bookings").select("*").eq("id", id).maybeSingle();
  return data ? bookingFromRow(data) : undefined;
}

export async function countPendingBookings(): Promise<number> {
  const { count } = await db()
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export async function createBooking(
  input: Omit<Booking, "id" | "createdAt" | "status"> & { status?: Booking["status"] },
): Promise<Booking> {
  const id = `bkg-${randomUUID().slice(0, 8)}`;
  const status = input.status ?? "pending";
  const createdAt = new Date().toISOString();
  const { error } = await db().from("bookings").insert({
    id,
    service_id: input.serviceId,
    staff_id: input.staffId,
    date: input.date,
    time: input.time,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    note: input.note,
    status,
    created_at: createdAt,
  });
  if (error) {
    // Unique-index violation = the slot was taken between the availability
    // check and this insert. Surface a typed error the caller can handle.
    if ((error as { code?: string }).code === "23505") throw new Error("SLOT_TAKEN");
    throw new Error(error.message);
  }
  return { ...input, id, status, createdAt };
}

export async function updateBookingStatus(
  id: string,
  status: Booking["status"],
): Promise<void> {
  const { error } = await db().from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await db().from("bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Availability ---------------- */

export async function getAvailableSlots(
  serviceId: string,
  staffId: string,
  date: string,
): Promise<string[]> {
  const settings = await getSettings();

  const day = new Date(date + "T00:00:00");
  if (Number.isNaN(day.getTime())) return [];
  if (settings.closedDays.includes(day.getDay())) return [];

  const service = await getService(serviceId);
  const duration = service?.durationMin ?? settings.slotMinutes;

  const open = toMinutes(settings.openTime);
  const close = toMinutes(settings.closeTime);
  const step = Math.max(5, settings.slotMinutes);

  // Existing bookings for this staff/date as [start, end) minute intervals.
  const { data: rows } = await db()
    .from("bookings")
    .select("time, service_id, status")
    .eq("staff_id", staffId)
    .eq("date", date)
    .neq("status", "cancelled");

  const services = await getServices();
  const booked = (rows ?? []).map((b) => {
    const start = toMinutes(b.time);
    const svc = services.find((s) => s.id === b.service_id);
    return [start, start + (svc?.durationMin ?? step)] as const;
  });

  const isToday = date === localTodayISO();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (let t = open; t + duration <= close; t += step) {
    if (isToday && t <= nowMin) continue;
    const overlaps = booked.some(([bs, be]) => t < be && t + duration > bs);
    if (!overlaps) slots.push(toHHMM(t));
  }
  return slots;
}

/* ---------------- Reviews ---------------- */

export async function getReviews(opts?: { activeOnly?: boolean }): Promise<Review[]> {
  let q = db().from("reviews").select("*").order("created_at", { ascending: false });
  if (opts?.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  return must(data, error).map(reviewFromRow);
}

export async function createReview(
  input: Omit<Review, "id" | "createdAt">,
): Promise<Review> {
  const id = `rev-${randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  const { error } = await db()
    .from("reviews")
    .insert({ id, created_at: createdAt, ...reviewToRow(input) });
  if (error) throw new Error(error.message);
  return { ...input, id, createdAt };
}

export async function updateReview(
  id: string,
  patch: Partial<Omit<Review, "id" | "createdAt">>,
): Promise<void> {
  const { error } = await db().from("reviews").update(reviewToRow(patch)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await db().from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Settings ---------------- */

export async function getSettings(): Promise<Settings> {
  const { data } = await db().from("settings").select("*").eq("id", 1).maybeSingle();
  return data ? settingsFromRow(data) : DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  const { error } = await db().from("settings").upsert({
    id: 1,
    open_time: next.openTime,
    close_time: next.closeTime,
    slot_minutes: next.slotMinutes,
    closed_days: next.closedDays,
  });
  if (error) throw new Error(error.message);
}
