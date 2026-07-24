import { randomUUID } from "crypto";
import { supabaseService } from "./supabase/service";
import { salonNowMinutes, salonToday } from "./time";
import type {
  Booking,
  Location,
  Review,
  Service,
  ServicePackage,
  Settings,
  Staff,
} from "./types";

const DEFAULT_SETTINGS: Settings = {
  openTime: "10:00",
  closeTime: "20:00",
  slotMinutes: 30,
  closedDays: [],
  salonName: "Lumière",
  tagline: "Гоо сайхны салон",
  phone: "",
  email: "",
  address: "",
  about: "",
  mapCoords: "",
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
// Андуурч уншихааргүй тэмдэгтүүд (0/O, 1/I) орхигдсон цагаан жагсаалт.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newBookingCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** Утасны дугаарыг зөвхөн цифрээр нь харьцуулна ("9911-2233" = "99112233"). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
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
  salePercent: r.sale_percent ?? 0,
  emoji: r.emoji ?? "✨",
  active: r.active ?? true,
});
const serviceToRow = (s: Partial<Service>) => ({
  ...(s.name !== undefined && { name: s.name }),
  ...(s.description !== undefined && { description: s.description }),
  ...(s.category !== undefined && { category: s.category }),
  ...(s.durationMin !== undefined && { duration_min: s.durationMin }),
  ...(s.price !== undefined && { price: s.price }),
  ...(s.salePercent !== undefined && { sale_percent: s.salePercent }),
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
  locationId: r.location_id ?? undefined,
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
  ...(s.locationId !== undefined && { location_id: s.locationId ?? null }),
  ...(s.active !== undefined && { active: s.active }),
});

const locationFromRow = (r: any): Location => ({
  id: r.id,
  name: r.name ?? "",
  address: r.address ?? "",
  phone: r.phone ?? "",
  mapCoords: r.map_coords ?? "",
  openTime: r.open_time ?? DEFAULT_SETTINGS.openTime,
  closeTime: r.close_time ?? DEFAULT_SETTINGS.closeTime,
  slotMinutes: r.slot_minutes ?? DEFAULT_SETTINGS.slotMinutes,
  closedDays: r.closed_days ?? [],
  sortOrder: r.sort_order ?? 0,
  active: r.active ?? true,
});
const locationToRow = (l: Partial<Location>) => ({
  ...(l.name !== undefined && { name: l.name }),
  ...(l.address !== undefined && { address: l.address }),
  ...(l.phone !== undefined && { phone: l.phone }),
  ...(l.mapCoords !== undefined && { map_coords: l.mapCoords }),
  ...(l.openTime !== undefined && { open_time: l.openTime }),
  ...(l.closeTime !== undefined && { close_time: l.closeTime }),
  ...(l.slotMinutes !== undefined && { slot_minutes: l.slotMinutes }),
  ...(l.closedDays !== undefined && { closed_days: l.closedDays }),
  ...(l.sortOrder !== undefined && { sort_order: l.sortOrder }),
  ...(l.active !== undefined && { active: l.active }),
});

const packageFromRow = (r: any): ServicePackage => ({
  id: r.id,
  name: r.name,
  description: r.description ?? "",
  serviceIds: r.service_ids ?? [],
  price: r.price ?? 0,
  emoji: r.emoji ?? "🎁",
  sortOrder: r.sort_order ?? 0,
  active: r.active ?? true,
});
const packageToRow = (p: Partial<ServicePackage>) => ({
  ...(p.name !== undefined && { name: p.name }),
  ...(p.description !== undefined && { description: p.description }),
  ...(p.serviceIds !== undefined && { service_ids: p.serviceIds }),
  ...(p.price !== undefined && { price: p.price }),
  ...(p.emoji !== undefined && { emoji: p.emoji }),
  ...(p.sortOrder !== undefined && { sort_order: p.sortOrder }),
  ...(p.active !== undefined && { active: p.active }),
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
  code: r.code ?? "",
  locationId: r.location_id ?? undefined,
  packageId: r.package_id ?? undefined,
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
  // Migration хийгээгүй байсан ч сайт унахгүйгээр анхны утгаараа ажиллана.
  salonName: r.salon_name || DEFAULT_SETTINGS.salonName,
  tagline: r.tagline ?? DEFAULT_SETTINGS.tagline,
  phone: r.phone ?? "",
  email: r.email ?? "",
  address: r.address ?? "",
  about: r.about ?? "",
  mapCoords: r.map_coords ?? "",
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

/* ---------------- Locations (салбарууд) ---------------- */

/** Хуучин нэг хаягтай салон — settings-ээс синтетик "loc-main" салбар үүсгэнэ. */
const LEGACY_LOCATION_ID = "loc-main";
function legacyLocationFromSettings(s: Settings): Location {
  return {
    id: LEGACY_LOCATION_ID,
    name: "",
    address: s.address,
    phone: s.phone,
    mapCoords: s.mapCoords,
    openTime: s.openTime,
    closeTime: s.closeTime,
    slotMinutes: s.slotMinutes,
    closedDays: s.closedDays,
    sortOrder: 0,
    active: true,
  };
}

export async function getLocations(opts?: { activeOnly?: boolean }): Promise<Location[]> {
  let q = db().from("locations").select("*").order("sort_order").order("name");
  if (opts?.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  return must(data, error).map(locationFromRow);
}

export async function getLocation(id: string): Promise<Location | undefined> {
  const { data } = await db().from("locations").select("*").eq("id", id).maybeSingle();
  return data ? locationFromRow(data) : undefined;
}

/**
 * Сайтад харуулах салбарууд. Салбар бүртгээгүй хуучин салонд settings-ээс
 * ганц синтетик салбар буцаана — ингэснээр migration хийхээс өмнө ч сайт унахгүй.
 */
export async function getEffectiveLocations(): Promise<Location[]> {
  const locations = await getLocations({ activeOnly: true });
  if (locations.length > 0) return locations;
  return [legacyLocationFromSettings(await getSettings())];
}

/** Сонгосон id-д тохирох салбар, олдохгүй бол эхнийх. Салбар байхгүй бол legacy. */
export async function getEffectiveLocation(id?: string): Promise<Location> {
  const locations = await getEffectiveLocations();
  return locations.find((l) => l.id === id) ?? locations[0];
}

export async function createLocation(input: Omit<Location, "id">): Promise<Location> {
  const id = `loc-${randomUUID().slice(0, 8)}`;
  const { error } = await db().from("locations").insert({ id, ...locationToRow(input) });
  if (error) throw new Error(error.message);
  return { ...input, id };
}

export async function updateLocation(
  id: string,
  patch: Partial<Omit<Location, "id">>,
): Promise<void> {
  const { error } = await db().from("locations").update(locationToRow(patch)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await db().from("locations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Packages (багц) ---------------- */

export async function getPackages(opts?: { activeOnly?: boolean }): Promise<ServicePackage[]> {
  let q = db().from("packages").select("*").order("sort_order").order("price");
  if (opts?.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  return must(data, error).map(packageFromRow);
}

export async function getPackage(id: string): Promise<ServicePackage | undefined> {
  const { data } = await db().from("packages").select("*").eq("id", id).maybeSingle();
  return data ? packageFromRow(data) : undefined;
}

export async function createPackage(
  input: Omit<ServicePackage, "id">,
): Promise<ServicePackage> {
  const id = `pkg-${randomUUID().slice(0, 8)}`;
  const { error } = await db().from("packages").insert({ id, ...packageToRow(input) });
  if (error) throw new Error(error.message);
  return { ...input, id };
}

export async function updatePackage(
  id: string,
  patch: Partial<Omit<ServicePackage, "id">>,
): Promise<void> {
  const { error } = await db().from("packages").update(packageToRow(patch)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePackage(id: string): Promise<void> {
  const { error } = await db().from("packages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Багцын нийт үргэлжлэх хугацаа = багтах үйлчилгээнүүдийн хугацааны нийлбэр. */
export async function getPackageDuration(pkg: ServicePackage): Promise<number> {
  const services = await getServices();
  const total = pkg.serviceIds.reduce((sum, id) => {
    const svc = services.find((s) => s.id === id);
    return sum + (svc?.durationMin ?? 0);
  }, 0);
  return Math.max(total, 15);
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
  input: Omit<Booking, "id" | "createdAt" | "status" | "code"> & {
    status?: Booking["status"];
  },
): Promise<Booking> {
  const id = `bkg-${randomUUID().slice(0, 8)}`;
  const status = input.status ?? "pending";
  const code = newBookingCode();
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
    code,
    location_id: input.locationId ?? null,
    package_id: input.packageId ?? null,
    created_at: createdAt,
  });
  if (error) {
    // Unique-index violation = the slot was taken between the availability
    // check and this insert. Surface a typed error the caller can handle.
    if ((error as { code?: string }).code === "23505") throw new Error("SLOT_TAKEN");
    throw new Error(error.message);
  }
  return { ...input, id, status, code, createdAt };
}

/**
 * Код + утасны дугаараар нэг захиалга олно. Хоёулаа таарсан үед л буцаана —
 * зөвхөн кодоор таамаглах, эсвэл зөвхөн дугаараар бусдын захиалга харах
 * боломжгүй болно.
 */
export async function getBookingByCodeAndPhone(
  code: string,
  phone: string,
): Promise<Booking | undefined> {
  const clean = code.trim().toUpperCase();
  if (!clean) return undefined;
  const { data } = await db()
    .from("bookings")
    .select("*")
    .eq("code", clean)
    .maybeSingle();
  if (!data) return undefined;
  const booking = bookingFromRow(data);
  if (normalizePhone(booking.customerPhone) !== normalizePhone(phone)) return undefined;
  return booking;
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

/**
 * Тухайн ажилтан/өдөр/хугацаанд эхлэх боломжтой цагууд. Үйлчилгээ болон
 * багц хоёулаа үүнийг ашиглана — ялгаа нь зөвхөн үргэлжлэх хугацаа (duration).
 */
async function computeAvailableSlots(
  staffId: string,
  date: string,
  durationMin: number,
): Promise<string[]> {
  // Ажлын цагийг тухайн ажилтны хамаарах салбараас авна — салбар бүр
  // өөрийн нээх/хаах цаг, амралтын өдөртэй. Салбаргүй бол эхний салбар/settings.
  const staff = await getStaffMember(staffId);
  const hours = await getEffectiveLocation(staff?.locationId);

  // Гаригийг UTC-ээр уншина — календарийн огнооны гариг цагийн бүсээс
  // хамаарахгүй тул серверийн бүс юу ч байсан ижил хариу өгнө.
  const day = new Date(date + "T00:00:00Z");
  if (Number.isNaN(day.getTime())) return [];
  if (hours.closedDays.includes(day.getUTCDay())) return [];

  const duration = Math.max(5, durationMin || hours.slotMinutes);
  const open = toMinutes(hours.openTime);
  const close = toMinutes(hours.closeTime);
  const step = Math.max(5, hours.slotMinutes);

  // Existing bookings for this staff/date as [start, end) minute intervals.
  const { data: rows } = await db()
    .from("bookings")
    .select("time, service_id, package_id, status")
    .eq("staff_id", staffId)
    .eq("date", date)
    .neq("status", "cancelled");

  const [services, packages] = await Promise.all([getServices(), getPackages()]);
  const packageDuration = (pkg: ServicePackage) =>
    pkg.serviceIds.reduce(
      (sum, id) => sum + (services.find((s) => s.id === id)?.durationMin ?? 0),
      0,
    );
  const booked = (rows ?? []).map((b) => {
    const start = toMinutes(b.time);
    // Багц захиалгын хугацаа = багтах үйлчилгээнүүдийн нийлбэр.
    const pkg = b.package_id ? packages.find((p) => p.id === b.package_id) : undefined;
    const svc = services.find((s) => s.id === b.service_id);
    const dur = pkg ? packageDuration(pkg) : (svc?.durationMin ?? step);
    return [start, start + Math.max(5, dur)] as const;
  });

  // Салоны цагаар тооцно — сервер UTC дээр ажиллаж байсан ч өнгөрсөн цаг
  // "сул" гэж харагдахгүй.
  const isToday = date === salonToday();
  const nowMin = salonNowMinutes();

  const slots: string[] = [];
  for (let t = open; t + duration <= close; t += step) {
    if (isToday && t <= nowMin) continue;
    const overlaps = booked.some(([bs, be]) => t < be && t + duration > bs);
    if (!overlaps) slots.push(toHHMM(t));
  }
  return slots;
}

export async function getAvailableSlots(
  serviceId: string,
  staffId: string,
  date: string,
): Promise<string[]> {
  const service = await getService(serviceId);
  return computeAvailableSlots(staffId, date, service?.durationMin ?? 0);
}

/** Багцаар захиалахад — нийт хугацааг багцын үйлчилгээнүүдээс тооцно. */
export async function getPackageAvailableSlots(
  packageId: string,
  staffId: string,
  date: string,
): Promise<string[]> {
  const pkg = await getPackage(packageId);
  if (!pkg) return [];
  return computeAvailableSlots(staffId, date, await getPackageDuration(pkg));
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
    salon_name: next.salonName,
    tagline: next.tagline,
    phone: next.phone,
    email: next.email,
    address: next.address,
    about: next.about,
    map_coords: next.mapCoords,
  });
  if (error) throw new Error(error.message);
}
