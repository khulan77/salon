import { randomUUID } from "crypto";
import { supabaseService } from "./supabase/service";
import { salonNowMinutes, salonToday } from "./time";
import type {
  Booking,
  BookingDraft,
  BookingStatus,
  DraftItem,
  Location,
  Payment,
  PaymentStatus,
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
  depositAmount: 0,
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
  imageUrl: r.image_url ?? undefined,
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
  ...(s.imageUrl !== undefined && { image_url: s.imageUrl ?? null }),
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
  // Хоосон мөрийг "салбаргүй" гэж үзнэ — эс тэгвээс мастерын салбар руу
  // унах fallback ажиллахгүй.
  locationId: r.location_id || undefined,
  packageId: r.package_id || undefined,
  // Хуучин мэдээллийн санд багана байхгүй байж болно — 0 гэж үзнэ.
  depositPaid: r.deposit_paid ?? 0,
  extraCharge: r.extra_charge ?? 0,
  createdAt: r.created_at,
  // 008 migration хийгээгүй санд багана байхгүй — ганц захиалга гэж үзнэ.
  groupId: r.group_id || undefined,
  staffLocked: r.staff_locked ?? false,
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
  heroImageUrl: r.hero_image_url ?? undefined,
  depositAmount: r.deposit_amount ?? 0,
});

const paymentFromRow = (r: any): Payment => ({
  id: r.id,
  status: r.status,
  amount: r.amount ?? 0,
  provider: r.provider ?? "mock",
  invoiceId: r.invoice_id ?? undefined,
  bookingId: r.booking_id ?? undefined,
  draft: (r.draft ?? {}) as BookingDraft,
  error: r.error ?? "",
  expiresAt: r.expires_at,
  createdAt: r.created_at,
  paidAt: r.paid_at ?? undefined,
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

/** Админы жагсаалтад хэрэглэх шүүлтүүд. Хоосон талбарыг тооцохгүй. */
export type BookingFilter = {
  status?: BookingStatus;
  from?: string; // YYYY-MM-DD, багтаана
  to?: string; // YYYY-MM-DD, багтаана
  locationId?: string;
  search?: string; // нэр / утас / захиалгын код
};

/** PostgREST-ийн or() шүүлтийг эвдэх тэмдэгтүүдийг цэвэрлэнэ. */
function cleanSearch(value: string): string {
  return value.replace(/[,()%*\\"]/g, " ").trim().slice(0, 60);
}

/**
 * Шүүлт хэрэглэсэн query. Жагсаалт ба тоолол хоёулаа үүнийг ашиглана —
 * ингэснээр харагдаж буй тоо, жагсаалт хоёр үргэлж нийцнэ.
 */
function filteredBookings(filter: BookingFilter, opts?: { head?: boolean }) {
  let q = db()
    .from("bookings")
    .select("*", { count: "exact", head: opts?.head ?? false });

  if (filter.status) q = q.eq("status", filter.status);
  if (filter.from) q = q.gte("date", filter.from);
  if (filter.to) q = q.lte("date", filter.to);
  if (filter.locationId) q = q.eq("location_id", filter.locationId);

  const search = cleanSearch(filter.search ?? "");
  if (search) {
    // Код үргэлж том үсгээр хадгалагддаг тул тэр талбарт томоор нь хайна.
    q = q.or(
      `customer_name.ilike.%${search}%,` +
        `customer_phone.ilike.%${search}%,` +
        `code.ilike.%${search.toUpperCase()}%`,
    );
  }
  return q;
}

/**
 * Админы захиалгын жагсаалт — шүүлт, хайлт, хуудаслалт бүгд мэдээллийн санд
 * хийгдэнэ. `total` нь хуудаслахаас өмнөх нийт тоо.
 */
export async function searchBookings(
  filter: BookingFilter & {
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
  },
): Promise<{ rows: Booking[]; total: number }> {
  const ascending = filter.order === "asc";
  let q = filteredBookings(filter)
    .order("date", { ascending })
    .order("time", { ascending });

  if (filter.limit !== undefined) {
    const from = filter.offset ?? 0;
    q = q.range(from, from + filter.limit - 1);
  }

  const { data, error, count } = await q;
  return { rows: must(data, error).map(bookingFromRow), total: count ?? 0 };
}

/** Төлөв бүрийн тоо — төлөвөөс бусад шүүлтийг хүндэтгэнэ (шошгон дээрх тоо). */
export async function countBookingsByStatus(
  filter: Omit<BookingFilter, "status">,
): Promise<Record<BookingStatus, number>> {
  const statuses: BookingStatus[] = [
    "pending",
    "confirmed",
    "done",
    "cancelled",
    "no_show",
  ];
  const results = await Promise.all(
    statuses.map((status) => filteredBookings({ ...filter, status }, { head: true })),
  );
  return Object.fromEntries(
    statuses.map((status, i) => [status, results[i].count ?? 0]),
  ) as Record<BookingStatus, number>;
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

/**
 * Захиалгын хүснэгтийн unique индексүүд. 23505 (давхцал) алдаа гарахад аль
 * индекс зөрчигдсөнийг ялгаж, тохирох хариу өгөхөд хэрэглэнэ.
 */
const SLOT_INDEX = "bookings_staff_slot_key";
const CODE_INDEX = "bookings_code_key";
const CODE_ATTEMPTS = 5;

export async function createBooking(
  input: Omit<
    Booking,
    "id" | "createdAt" | "status" | "code" | "depositPaid" | "extraCharge" | "groupId"
  > & {
    status?: Booking["status"];
    groupId?: string;
  },
): Promise<Booking> {
  const id = `bkg-${randomUUID().slice(0, 8)}`;
  const status = input.status ?? "pending";
  const createdAt = new Date().toISOString();
  const row = {
    id,
    service_id: input.serviceId,
    staff_id: input.staffId,
    date: input.date,
    time: input.time,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    note: input.note,
    status,
    location_id: input.locationId ?? null,
    package_id: input.packageId ?? null,
    created_at: createdAt,
  };
  // Бүлгийн баганыг зөвхөн хэрэгтэй үед бичнэ — 008 migration хийгээгүй санд
  // ганц үйлчилгээтэй захиалга хэвийн ажилласаар байна.
  let groupId = input.groupId;

  // Код санамсаргүй үүсдэг тул ховор ч давхцаж болно — тэр тохиолдолд шинэ
  // код гаргаад дахин оролдоно. Цаг давхцсаныг л SLOT_TAKEN гэж дамжуулна.
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const code = newBookingCode();
    const { error } = await db()
      .from("bookings")
      .insert({ ...row, code, ...(groupId && { group_id: groupId }) });
    // Шинэ захиалгад төлбөр хараахан бүртгэгдээгүй.
    if (!error)
      return { ...input, groupId, id, status, code, createdAt, depositPaid: 0, extraCharge: 0 };
    if (groupId && error.message.includes("group_id")) {
      // Багана алга — захиалгыг холбоосгүйгээр ч гэсэн үүсгэнэ.
      console.warn("bookings.group_id алга: supabase/migrations/008-booking-group.sql-ыг ажиллуулна уу.");
      groupId = undefined;
      attempt--;
      continue;
    }
    if (error.code !== "23505") throw new Error(error.message);

    const conflict = `${error.message} ${error.details ?? ""}`;
    // Шалгалт хийснээс хойш тэр цагийг өөр хүн авчихсан байна.
    if (conflict.includes(SLOT_INDEX)) throw new Error("SLOT_TAKEN");
    if (!conflict.includes(CODE_INDEX)) throw new Error(error.message);
  }
  throw new Error("CODE_EXHAUSTED");
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
  if (error) {
    // Цуцлагдсан захиалгыг эргүүлэн сэргээх үед тэр цагийг өөр захиалга
    // эзэлчихсэн байж болно.
    if (error.code === "23505") {
      throw new Error("Энэ цагт өөр захиалга бүртгэгдсэн тул сэргээх боломжгүй.");
    }
    throw new Error(error.message);
  }
}

/**
 * Захиалгыг засна — үйлчилгээ, мастер (өөр хүн рүү шилжүүлэх), огноо, цаг,
 * үйлчлүүлэгчийн мэдээлэл. Давхцлыг дуудагч тал шалгасан байх ёстой; яг ижил
 * цагт давхцвал индекс няцааж SLOT_TAKEN болно.
 */
export async function updateBooking(
  id: string,
  patch: Pick<
    Booking,
    "serviceId" | "staffId" | "date" | "time" | "customerName" | "customerPhone" | "note"
  > & { packageId?: string; locationId?: string },
): Promise<void> {
  const { error } = await db()
    .from("bookings")
    .update({
      service_id: patch.serviceId,
      package_id: patch.packageId ?? null,
      staff_id: patch.staffId,
      date: patch.date,
      time: patch.time,
      customer_name: patch.customerName,
      customer_phone: patch.customerPhone,
      note: patch.note,
      location_id: patch.locationId ?? null,
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("SLOT_TAKEN");
    throw new Error(error.message);
  }
}

/** ⭐ тэмдэглэгээ — үйлчлүүлэгчийг энэ мастерт "түгжинэ". */
export async function updateBookingStaffLocked(id: string, locked: boolean): Promise<void> {
  const { error } = await db().from("bookings").update({ staff_locked: locked }).eq("id", id);
  if (error) {
    if (error.message.includes("staff_locked")) {
      throw new Error(
        "Мэдээллийн санд ⭐ багана алга. supabase/migrations/009-booking-staff-lock.sql-ыг ажиллуулна уу.",
      );
    }
    throw new Error(error.message);
  }
}

/** Хамт захиалсан бусад үйлчилгээнүүд (өөрийг нь оруулаад). */
export async function getBookingGroup(groupId: string): Promise<Booking[]> {
  const { data, error } = await db()
    .from("bookings")
    .select("*")
    .eq("group_id", groupId)
    .order("time");
  // Багана байхгүй (migration хийгээгүй) бол бүлэг гэж байхгүй.
  if (error) return [];
  return (data ?? []).map(bookingFromRow);
}

/**
 * Захиалгын төлбөрийн дүнг шинэчилнэ (төлсөн урьдчилгаа, нэмэлт төлбөр).
 * Багана нь хуучин мэдээллийн санд байхгүй бол ойлгомжтой алдаа буцаана.
 */
export async function updateBookingAmounts(
  id: string,
  amounts: { depositPaid?: number; extraCharge?: number },
): Promise<void> {
  const patch: Record<string, number> = {};
  if (amounts.depositPaid !== undefined) patch.deposit_paid = amounts.depositPaid;
  if (amounts.extraCharge !== undefined) patch.extra_charge = amounts.extraCharge;
  if (Object.keys(patch).length === 0) return;

  const { error } = await db().from("bookings").update(patch).eq("id", id);
  if (error) {
    if (/column .* does not exist/i.test(error.message)) {
      throw new Error(
        "Мэдээллийн санд төлбөрийн багана алга. supabase/migrations/007-booking-payments.sql-ыг ажиллуулна уу.",
      );
    }
    throw new Error(error.message);
  }
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await db().from("bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Availability ---------------- */

/**
 * Мастерын тухайн өдрийн захиалгууд [эхлэх, дуусах) минутаар. Цуцлагдсан нь
 * цаг эзлэхгүй. `excludeId` — засаж буй захиалга өөртэйгөө давхцахгүй.
 */
async function bookedIntervals(
  staffId: string,
  date: string,
  opts?: { excludeId?: string; fallbackMin?: number },
): Promise<(readonly [number, number])[]> {
  let q = db()
    .from("bookings")
    .select("id, time, service_id, package_id")
    .eq("staff_id", staffId)
    .eq("date", date)
    .neq("status", "cancelled");
  if (opts?.excludeId) q = q.neq("id", opts.excludeId);
  const { data: rows } = await q;

  const [services, packages] = await Promise.all([getServices(), getPackages()]);
  const packageDuration = (pkg: ServicePackage) =>
    pkg.serviceIds.reduce(
      (sum, id) => sum + (services.find((s) => s.id === id)?.durationMin ?? 0),
      0,
    );
  return (rows ?? []).map((b) => {
    const start = toMinutes(b.time);
    // Багц захиалгын хугацаа = багтах үйлчилгээнүүдийн нийлбэр.
    const pkg = b.package_id ? packages.find((p) => p.id === b.package_id) : undefined;
    const svc = services.find((s) => s.id === b.service_id);
    const dur = pkg ? packageDuration(pkg) : (svc?.durationMin ?? opts?.fallbackMin ?? 30);
    return [start, start + Math.max(5, dur)] as const;
  });
}

/**
 * Мастер тухайн хугацаанд өөр захиалгатай давхцаж байна уу. Админ захиалга
 * засахад (өөр мастер руу шилжүүлэх, цаг солих) ажлын цагийг биш, зөвхөн
 * давхцлыг шалгана.
 */
export async function hasBookingConflict(
  staffId: string,
  date: string,
  time: string,
  durationMin: number,
  excludeId?: string,
): Promise<boolean> {
  const start = toMinutes(time);
  const end = start + Math.max(5, durationMin);
  const booked = await bookedIntervals(staffId, date, { excludeId });
  return booked.some(([bs, be]) => start < be && end > bs);
}

/**
 * Тухайн ажилтан/өдөр/хугацаанд эхлэх боломжтой цагууд. Үйлчилгээ болон
 * багц хоёулаа үүнийг ашиглана — ялгаа нь зөвхөн үргэлжлэх хугацаа (duration).
 */
async function computeAvailableSlots(
  staffId: string,
  date: string,
  durationMin: number,
  locationId?: string,
): Promise<string[]> {
  // Ажлын цагийг салбараас авна — салбар бүр өөрийн нээх/хаах цаг, амралтын
  // өдөртэй. Ажилтан тодорхой салбартай бол түүнийхээр, салбаргүй (бүх
  // салбарт ажилладаг) бол үйлчлүүлэгчийн сонгосон салбарын цагаар тооцно.
  const staff = await getStaffMember(staffId);
  const hours = await getEffectiveLocation(staff?.locationId || locationId);

  // Гаригийг UTC-ээр уншина — календарийн огнооны гариг цагийн бүсээс
  // хамаарахгүй тул серверийн бүс юу ч байсан ижил хариу өгнө.
  const day = new Date(date + "T00:00:00Z");
  if (Number.isNaN(day.getTime())) return [];
  if (hours.closedDays.includes(day.getUTCDay())) return [];

  const duration = Math.max(5, durationMin || hours.slotMinutes);
  const open = toMinutes(hours.openTime);
  const close = toMinutes(hours.closeTime);
  const step = Math.max(5, hours.slotMinutes);
  const booked = await bookedIntervals(staffId, date, { fallbackMin: step });

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
  locationId?: string,
): Promise<string[]> {
  const service = await getService(serviceId);
  return computeAvailableSlots(staffId, date, service?.durationMin ?? 0, locationId);
}

/**
 * Хэд хэдэн үйлчилгээг нэг дор захиалахад бүгдэд нь тохирох эхлэх цагууд.
 * Мастер бүрийн ачааллыг (нэг мастерт хоёр үйлчилгээ бол нийлбэр хугацаа)
 * тусад нь тооцоод, огтлолцлыг нь буцаана — бүх мастер зэрэг сул байх цаг.
 */
export async function getMultiAvailableSlots(
  items: DraftItem[],
  date: string,
  locationId?: string,
): Promise<string[]> {
  if (items.length === 0) return [];
  const services = await getServices();
  const perStaff = new Map<string, number>();
  for (const i of items) {
    const dur = services.find((s) => s.id === i.serviceId)?.durationMin ?? 0;
    perStaff.set(i.staffId, (perStaff.get(i.staffId) ?? 0) + dur);
  }
  const lists = await Promise.all(
    [...perStaff].map(([staffId, dur]) => computeAvailableSlots(staffId, date, dur, locationId)),
  );
  return lists.reduce((acc, list) => acc.filter((t) => list.includes(t)));
}

/** Багцаар захиалахад — нийт хугацааг багцын үйлчилгээнүүдээс тооцно. */
export async function getPackageAvailableSlots(
  packageId: string,
  staffId: string,
  date: string,
  locationId?: string,
): Promise<string[]> {
  const pkg = await getPackage(packageId);
  if (!pkg) return [];
  return computeAvailableSlots(staffId, date, await getPackageDuration(pkg), locationId);
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
    hero_image_url: next.heroImageUrl ?? null,
    deposit_amount: next.depositAmount,
  });
  if (error) throw new Error(error.message);
}

/* ---------------- Payments (урьдчилгаа) ---------------- */

/** Нэхэмжлэх хүчинтэй байх хугацаа — үүний дараа цаг өөр хүнд чөлөөлөгдөнө. */
export const PAYMENT_TTL_MINUTES = 15;

export async function createPayment(input: {
  amount: number;
  provider: string;
  draft: BookingDraft;
}): Promise<Payment> {
  const id = `pay-${randomUUID().slice(0, 10)}`;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + PAYMENT_TTL_MINUTES * 60_000);
  const { error } = await db().from("payments").insert({
    id,
    status: "pending",
    amount: input.amount,
    provider: input.provider,
    draft: input.draft,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(error.message);
  return {
    id,
    status: "pending",
    amount: input.amount,
    provider: input.provider,
    draft: input.draft,
    error: "",
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getPayment(id: string): Promise<Payment | undefined> {
  const { data } = await db().from("payments").select("*").eq("id", id).maybeSingle();
  return data ? paymentFromRow(data) : undefined;
}

export async function updatePayment(
  id: string,
  patch: {
    status?: PaymentStatus;
    invoiceId?: string;
    bookingId?: string;
    error?: string;
    paidAt?: string;
  },
): Promise<void> {
  const { error } = await db()
    .from("payments")
    .update({
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.invoiceId !== undefined && { invoice_id: patch.invoiceId }),
      ...(patch.bookingId !== undefined && { booking_id: patch.bookingId }),
      ...(patch.error !== undefined && { error: patch.error }),
      ...(patch.paidAt !== undefined && { paid_at: patch.paidAt }),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getPayments(status?: PaymentStatus): Promise<Payment[]> {
  let q = db().from("payments").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q.limit(200);
  return must(data, error).map(paymentFromRow);
}

/**
 * Хугацаа нь дууссан, төлөгдөөгүй нэхэмжлэхүүдийг хаана. Цаг эзэлдэггүй тул
 * заавал биш ч жагсаалт цэвэрхэн байлгана — уншилт бүрийн өмнө дуудагдана.
 */
export async function expireStalePayments(): Promise<void> {
  await db()
    .from("payments")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
}
