import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Booking, Database, Review, Service, Settings, Staff } from "./types";

const DEFAULT_SETTINGS: Settings = {
  openTime: "10:00",
  closeTime: "20:00",
  slotMinutes: 30,
  closedDays: [], // open every day by default
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

// JSON-file store. The file is read/written via `fs` at request time (never
// imported into the module graph), so writes don't trigger Fast Refresh.
// DATA_DIR can point at a mounted persistent disk (e.g. on Render) via env.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const seed: Database = {
  services: [
    {
      id: "svc-haircut",
      name: "Үс засалт & загвар",
      description:
        "Мэргэжлийн үс засалт, угаалга болон загварчлал. Таны царайд тохирсон загвар.",
      category: "Үс",
      durationMin: 60,
      price: 45000,
      emoji: "✂️",
      active: true,
    },
    {
      id: "svc-color",
      name: "Үс будалт",
      description: "Чанартай будгаар үс будах, өнгө сэргээх, балаяж, омбре.",
      category: "Үс",
      durationMin: 120,
      price: 120000,
      emoji: "🎨",
      active: true,
    },
    {
      id: "svc-manicure",
      name: "Гар засал (Manicure)",
      description: "Хумсны арчилгаа, гель лак, дизайн. Урт удаан барих чанар.",
      category: "Хумс",
      durationMin: 90,
      price: 55000,
      emoji: "💅",
      active: true,
    },
    {
      id: "svc-facial",
      name: "Нүүрний арчилгаа",
      description: "Гүн цэвэрлэгээ, чийгшүүлэлт болон тайвшруулах массаж.",
      category: "Арьс",
      durationMin: 75,
      price: 80000,
      emoji: "🧖‍♀️",
      active: true,
    },
    {
      id: "svc-makeup",
      name: "Нүүр будалт",
      description: "Өдөр тутмын болон онцгой үйл явдлын мэргэжлийн нүүр будалт.",
      category: "Гоо сайхан",
      durationMin: 60,
      price: 70000,
      emoji: "💄",
      active: true,
    },
    {
      id: "svc-lash",
      name: "Сормуус суулгац",
      description: "Байгалийн болон өтгөн сормуусны суулгац, засвар.",
      category: "Гоо сайхан",
      durationMin: 90,
      price: 90000,
      emoji: "👁️",
      active: true,
    },
  ],
  staff: [
    {
      id: "stf-saraa",
      name: "Сараа",
      title: "Ахлах стилист",
      bio: "10 гаруй жилийн туршлагатай, олон улсын сертификаттай үсчин.",
      serviceIds: ["svc-haircut", "svc-color"],
      emoji: "💇‍♀️",
      active: true,
    },
    {
      id: "stf-bolor",
      name: "Болор",
      title: "Хумсны мастер",
      bio: "Nail art-ын мэргэжилтэн. Нарийн дизайн, цэвэрхэн ажил.",
      serviceIds: ["svc-manicure"],
      emoji: "💅",
      active: true,
    },
    {
      id: "stf-nomin",
      name: "Номин",
      title: "Гоо сайхны мэргэжилтэн",
      bio: "Арьс арчилгаа, нүүр будалт, сормуусны чиглэлээр мэргэшсэн.",
      serviceIds: ["svc-facial", "svc-makeup", "svc-lash"],
      emoji: "🌸",
      active: true,
    },
  ],
  bookings: [],
  reviews: [
    {
      id: "rev-1",
      customerName: "Оюунаа",
      rating: 5,
      text: "Маш тансаг үйлчилгээ. Сараа гуайн үс засалт үнэхээр гоё болсон, дахин очно!",
      active: true,
      createdAt: "2026-05-02T10:00:00.000Z",
    },
    {
      id: "rev-2",
      customerName: "Тэмүүлэн",
      rating: 5,
      text: "Онлайн цаг захиалга нь маш хялбар. Цаг барьдаг, цэвэрхэн орчин.",
      active: true,
      createdAt: "2026-05-14T10:00:00.000Z",
    },
    {
      id: "rev-3",
      customerName: "Сарантуяа",
      rating: 4,
      text: "Номин маань нүүр будалтыг гоё хийдэг. Найзууддаа санал болгосон.",
      active: true,
      createdAt: "2026-06-01T10:00:00.000Z",
    },
  ],
  settings: DEFAULT_SETTINGS,
};

async function ensureDb(): Promise<void> {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), "utf-8");
  }
}

async function readDb(): Promise<Database> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  const db = JSON.parse(raw) as Database;
  // Defensive defaults in case the file predates a field.
  db.services ??= [];
  db.staff ??= [];
  db.bookings ??= [];
  db.reviews ??= [];
  db.settings = { ...DEFAULT_SETTINGS, ...(db.settings ?? {}) };
  return db;
}

async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

/* ---------------- Services ---------------- */

export async function getServices(opts?: { activeOnly?: boolean }): Promise<Service[]> {
  const db = await readDb();
  const list = opts?.activeOnly ? db.services.filter((s) => s.active) : db.services;
  return list;
}

export async function getService(id: string): Promise<Service | undefined> {
  const db = await readDb();
  return db.services.find((s) => s.id === id);
}

export async function createService(input: Omit<Service, "id">): Promise<Service> {
  const db = await readDb();
  const svc: Service = { ...input, id: `svc-${randomUUID().slice(0, 8)}` };
  db.services.push(svc);
  await writeDb(db);
  return svc;
}

export async function updateService(
  id: string,
  patch: Partial<Omit<Service, "id">>,
): Promise<void> {
  const db = await readDb();
  const svc = db.services.find((s) => s.id === id);
  if (!svc) return;
  Object.assign(svc, patch);
  await writeDb(db);
}

export async function deleteService(id: string): Promise<void> {
  const db = await readDb();
  db.services = db.services.filter((s) => s.id !== id);
  await writeDb(db);
}

/* ---------------- Staff ---------------- */

export async function getStaff(opts?: { activeOnly?: boolean }): Promise<Staff[]> {
  const db = await readDb();
  return opts?.activeOnly ? db.staff.filter((s) => s.active) : db.staff;
}

export async function getStaffMember(id: string): Promise<Staff | undefined> {
  const db = await readDb();
  return db.staff.find((s) => s.id === id);
}

export async function getStaffByEmail(email: string): Promise<Staff | undefined> {
  const db = await readDb();
  const lower = email.toLowerCase();
  return db.staff.find((s) => s.email && s.email.toLowerCase() === lower);
}

export async function getStaffForService(serviceId: string): Promise<Staff[]> {
  const db = await readDb();
  return db.staff.filter(
    (s) => s.active && (s.serviceIds.length === 0 || s.serviceIds.includes(serviceId)),
  );
}

export async function createStaff(input: Omit<Staff, "id">): Promise<Staff> {
  const db = await readDb();
  const member: Staff = { ...input, id: `stf-${randomUUID().slice(0, 8)}` };
  db.staff.push(member);
  await writeDb(db);
  return member;
}

export async function updateStaff(
  id: string,
  patch: Partial<Omit<Staff, "id">>,
): Promise<void> {
  const db = await readDb();
  const member = db.staff.find((s) => s.id === id);
  if (!member) return;
  Object.assign(member, patch);
  await writeDb(db);
}

export async function deleteStaff(id: string): Promise<void> {
  const db = await readDb();
  db.staff = db.staff.filter((s) => s.id !== id);
  await writeDb(db);
}

/* ---------------- Bookings ---------------- */

export async function getBookings(): Promise<Booking[]> {
  const db = await readDb();
  return [...db.bookings].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
}

export async function createBooking(
  input: Omit<Booking, "id" | "createdAt" | "status"> & { status?: Booking["status"] },
): Promise<Booking> {
  const db = await readDb();
  const booking: Booking = {
    ...input,
    id: `bkg-${randomUUID().slice(0, 8)}`,
    status: input.status ?? "pending",
    createdAt: new Date().toISOString(),
  };
  db.bookings.push(booking);
  await writeDb(db);
  return booking;
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const db = await readDb();
  return db.bookings.find((b) => b.id === id);
}

export async function countPendingBookings(): Promise<number> {
  const db = await readDb();
  return db.bookings.filter((b) => b.status === "pending").length;
}

export async function updateBookingStatus(
  id: string,
  status: Booking["status"],
): Promise<void> {
  const db = await readDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) return;
  booking.status = status;
  await writeDb(db);
}

export async function deleteBooking(id: string): Promise<void> {
  const db = await readDb();
  db.bookings = db.bookings.filter((b) => b.id !== id);
  await writeDb(db);
}

/* ---------------- Reviews ---------------- */

export async function getReviews(opts?: { activeOnly?: boolean }): Promise<Review[]> {
  const db = await readDb();
  const list = opts?.activeOnly ? db.reviews.filter((r) => r.active) : db.reviews;
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createReview(
  input: Omit<Review, "id" | "createdAt">,
): Promise<Review> {
  const db = await readDb();
  const review: Review = {
    ...input,
    id: `rev-${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  db.reviews.push(review);
  await writeDb(db);
  return review;
}

export async function updateReview(
  id: string,
  patch: Partial<Omit<Review, "id" | "createdAt">>,
): Promise<void> {
  const db = await readDb();
  const review = db.reviews.find((r) => r.id === id);
  if (!review) return;
  Object.assign(review, patch);
  await writeDb(db);
}

export async function deleteReview(id: string): Promise<void> {
  const db = await readDb();
  db.reviews = db.reviews.filter((r) => r.id !== id);
  await writeDb(db);
}

/* ---------------- Settings ---------------- */

export async function getSettings(): Promise<Settings> {
  const db = await readDb();
  return db.settings;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const db = await readDb();
  db.settings = { ...db.settings, ...patch };
  await writeDb(db);
}

/* ---------------- Availability ---------------- */

/**
 * Available start times (HH:mm) for a service with a given staff on a date.
 * Respects working hours, closed weekdays, already-booked intervals (accounting
 * for each booking's service duration), and — for today — hides past times.
 */
export async function getAvailableSlots(
  serviceId: string,
  staffId: string,
  date: string,
): Promise<string[]> {
  const db = await readDb();
  const settings = db.settings;

  const day = new Date(date + "T00:00:00");
  if (Number.isNaN(day.getTime())) return [];
  if (settings.closedDays.includes(day.getDay())) return [];

  const service = db.services.find((s) => s.id === serviceId);
  const duration = service?.durationMin ?? settings.slotMinutes;

  const open = toMinutes(settings.openTime);
  const close = toMinutes(settings.closeTime);
  const step = Math.max(5, settings.slotMinutes);

  // Existing bookings for this staff/date as [start, end) minute intervals.
  const booked = db.bookings
    .filter((b) => b.staffId === staffId && b.date === date && b.status !== "cancelled")
    .map((b) => {
      const start = toMinutes(b.time);
      const svc = db.services.find((s) => s.id === b.serviceId);
      return [start, start + (svc?.durationMin ?? step)] as const;
    });

  const isToday = date === localTodayISO();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (let t = open; t + duration <= close; t += step) {
    if (isToday && t <= nowMin) continue; // no past times today
    const overlaps = booked.some(([bs, be]) => t < be && t + duration > bs);
    if (!overlaps) slots.push(toHHMM(t));
  }
  return slots;
}
