/*
  Админы үзүүлэнгийн жишээ өгөгдөл. Өгөгдлийн сан огт хөндөхгүй — салон бүрт
  тохиргоогүйгээр нээгдэх ёстой. Огноог "өнөөдрөөс хэдэн хоногийн зайтай"
  (`day`) гэж хадгална, тиймээс demo хэзээ нээгдсэн ч хуанли дүүрэн харагдана.
*/

export type Status = "pending" | "confirmed" | "done" | "no_show" | "cancelled";

export type DemoService = {
  id: string;
  name: string;
  emoji: string;
  durationMin: number;
  price: number;
  /** Хямдралтай бол хуучин үнэ. */
  oldPrice?: number;
};

export type DemoPackage = {
  id: string;
  name: string;
  emoji: string;
  serviceIds: string[];
  price: number;
};

export type DemoBranch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  openMin: number;
  closeMin: number;
  /** 0 = Ням … 6 = Бямба */
  closedDays: number[];
};

export type DemoStaff = {
  id: string;
  name: string;
  title: string;
  emoji: string;
  branchId: string;
  serviceIds: string[];
};

export type DemoBooking = {
  id: string;
  code: string;
  name: string;
  phone: string;
  /** "svc:<id>" эсвэл "pkg:<id>" — жинхэнэ админы маягттай ижил. */
  item: string;
  staffId: string;
  /** Өнөөдрөөс хэдэн хоногийн зайтай (өчигдөр = -1). */
  day: number;
  /** Эхлэх цаг, шөнө дундаас хойшхи минутаар. */
  start: number;
  status: Status;
  /** Төлөгдсөн дүн (QPay урьдчилгаа г.м). */
  paid: number;
  /** ★ — зөвхөн энэ мастер дээр. */
  locked?: boolean;
  /** 👥 — нэг үйлчлүүлэгч хэд хэдэн мастер дээр зэрэг. */
  groupId?: string;
  note?: string;
  /** Дөнгөж ирсэн — хуанли, жагсаалтад тодруулна. */
  fresh?: boolean;
};

export const money = (n: number) => `${n.toLocaleString("mn-MN")}₮`;

/** 690 -> "11:30" */
export function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

/** Өнөөдрөөс `day` хоногийн дараах огноо. */
export function dateOf(today: Date, day: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + day);
  return d;
}

/** "15 / 09" */
export function dayMonth(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function dayLabel(today: Date, day: number): string {
  if (day === 0) return "Өнөөдөр";
  if (day === 1) return "Маргааш";
  if (day === -1) return "Өчигдөр";
  const d = dateOf(today, day);
  return `${dayMonth(d)} · ${WEEKDAYS[d.getDay()]}`;
}

/* ── Салон ─────────────────────────────────────────────────────────── */

export const services: DemoService[] = [
  { id: "cut", name: "Үс засалт", emoji: "✂️", durationMin: 45, price: 35000 },
  { id: "color", name: "Гэрэл будалт", emoji: "🎨", durationMin: 90, price: 120000, oldPrice: 140000 },
  { id: "makeup", name: "Нүүр будалт", emoji: "💄", durationMin: 60, price: 75000 },
  { id: "facial", name: "Нүүр арчилгаа", emoji: "🧖‍♀️", durationMin: 75, price: 85000 },
  { id: "lash", name: "Сормуус суулгац", emoji: "👁️", durationMin: 120, price: 90000 },
  { id: "nails", name: "Хумсны засал", emoji: "💅", durationMin: 60, price: 45000 },
  { id: "mani", name: "Гар засал", emoji: "🤲", durationMin: 45, price: 40000 },
];

export const packages: DemoPackage[] = [
  { id: "bride", name: "Сүйт бүсгүйн багц", emoji: "👰", serviceIds: ["makeup", "cut", "nails"], price: 140000 },
  { id: "fresh", name: "Сэргэлтийн багц", emoji: "🌿", serviceIds: ["facial", "mani"], price: 110000 },
];

export const branches: DemoBranch[] = [
  {
    id: "center",
    name: "Төв салбар",
    address: "СБД, Сөүлийн гудамж 12",
    phone: "7700 1234",
    openMin: 10 * 60,
    closeMin: 20 * 60,
    closedDays: [],
  },
  {
    id: "zaisan",
    name: "Зайсан салбар",
    address: "ХУД, Зайсан, Hill Complex 2 давхар",
    phone: "7700 5678",
    openMin: 10 * 60,
    closeMin: 19 * 60,
    closedDays: [0],
  },
];

export const staff: DemoStaff[] = [
  { id: "saraa", name: "Сараа", title: "Ахлах мастер", emoji: "💇‍♀️", branchId: "center", serviceIds: ["cut", "color"] },
  { id: "nomin", name: "Номин", title: "Гоо сайхны мэргэжилтэн", emoji: "🌸", branchId: "center", serviceIds: ["makeup", "facial", "lash"] },
  { id: "bolor", name: "Болор", title: "Хумсны мастер", emoji: "💅", branchId: "center", serviceIds: ["nails", "mani"] },
  { id: "temuulen", name: "Тэмүүлэн", title: "Колорист", emoji: "🎨", branchId: "center", serviceIds: ["color", "cut"] },
  { id: "anu", name: "Ану", title: "Үсчин", emoji: "✂️", branchId: "zaisan", serviceIds: ["cut", "color"] },
  { id: "misheel", name: "Мишээл", title: "Хумс · арьс арчилгаа", emoji: "🌿", branchId: "zaisan", serviceIds: ["nails", "mani", "facial"] },
];

export const branchOf = (staffId: string) =>
  staff.find((m) => m.id === staffId)?.branchId ?? branches[0].id;

/** Захиалсан зүйлийн нэр, хугацаа, үнэ — үйлчилгээ ч, багц ч адилхан. */
export function itemInfo(item: string): {
  label: string;
  emoji: string;
  durationMin: number;
  price: number;
  isPackage: boolean;
} {
  if (item.startsWith("pkg:")) {
    const p = packages.find((x) => `pkg:${x.id}` === item);
    const parts = services.filter((s) => p?.serviceIds.includes(s.id));
    return {
      label: `${p?.name ?? "Багц"} (багц)`,
      emoji: p?.emoji ?? "🎁",
      durationMin: parts.reduce((sum, s) => sum + s.durationMin, 0) || 60,
      price: p?.price ?? 0,
      isPackage: true,
    };
  }
  const s = services.find((x) => `svc:${x.id}` === item);
  return {
    label: s?.name ?? "—",
    emoji: s?.emoji ?? "✨",
    durationMin: s?.durationMin ?? 30,
    price: s?.price ?? 0,
    isPackage: false,
  };
}

/** Мастер энэ зүйлийг хийж чадах уу. Багцыг бүгд хийнэ (дотор нь хуваана). */
export function canDo(m: DemoStaff, item: string): boolean {
  return item.startsWith("pkg:") || m.serviceIds.includes(item.slice(4));
}

/**
 * Тухайн мастер, өдөр `start`-аас `durationMin` минут завтай юу.
 * `ignoreId` — засаж буй захиалга өөртэйгөө давхцахгүй.
 */
export function isFree(
  list: DemoBooking[],
  staffId: string,
  day: number,
  start: number,
  durationMin: number,
  ignoreId?: string,
): boolean {
  return !list.some((b) => {
    if (b.id === ignoreId || b.staffId !== staffId || b.day !== day) return false;
    if (b.status === "cancelled") return false;
    const end = b.start + itemInfo(b.item).durationMin;
    return start < end && b.start < start + durationMin;
  });
}

/** Мастерын тухайн өдрийн сул эхлэх цагууд — 15 минутын алхамтай. */
export function freeSlots(
  list: DemoBooking[],
  staffId: string,
  day: number,
  durationMin: number,
  ignoreId?: string,
): number[] {
  const branch = branches.find((br) => br.id === branchOf(staffId)) ?? branches[0];
  const out: number[] = [];
  for (let t = branch.openMin; t + durationMin <= branch.closeMin; t += 15) {
    if (isFree(list, staffId, day, t, durationMin, ignoreId)) out.push(t);
  }
  return out;
}

/* ── Захиалгууд ────────────────────────────────────────────────────── */

const FIRST = [
  "Ариунаа", "Мөнхзул", "Оюунаа", "Энхжин", "Баярмаа", "Сарнай", "Хулан",
  "Номуун", "Уянга", "Дөлгөөн", "Сувдаа", "Оюука", "Саруул", "Анужин",
  "Золбоо", "Туяа", "Солонго", "Цэцгээ", "Мишээл", "Гэрэлээ", "Нандин",
  "Алтанцэцэг", "Тэмүүжин", "Билгүүн", "Марал", "Индра", "Сэлэнгэ",
];
const INITIAL = "АБГДЭЖЗИЛМНОӨПРСТУҮХЦЧШ";

/** Тогтвортой санамсаргүй тоо — demo бүр ижилхэн дүр зурагтай нээгдэнэ. */
function seeded(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const T = (h: number, m = 0) => h * 60 + m;

/**
 * Өнөөдрийн Төв салбарын хуваарь — гараар зохиосон, хуанлийн бүх онцлог
 * (баталгаажсан/хүлээгдэж буй, дууссан, ирээгүй, ★, 👥 хамт захиалсан, багц,
 * цуцлагдсан түүх) нэг дэлгэцэд харагдахаар.
 */
const TODAY_CENTER: Omit<DemoBooking, "id" | "code" | "day">[] = [
  { name: "Г. Баярмаа", phone: "9505 3311", item: "svc:cut", staffId: "saraa", start: T(10), status: "cancelled", paid: 0 },
  { name: "Т. Энхжин", phone: "9019 7766", item: "svc:cut", staffId: "saraa", start: T(10, 30), status: "done", paid: 35000 },
  { name: "Б. Сарнай", phone: "8800 1122", item: "svc:color", staffId: "saraa", start: T(11, 30), status: "confirmed", paid: 10000, locked: true, note: "Өнгөрсөн удаагийнхаас арай цайвар" },
  { name: "Н. Хулан", phone: "9911 4545", item: "svc:cut", staffId: "saraa", start: T(13, 30), status: "confirmed", paid: 0, groupId: "g-hulan" },
  { name: "Б. Ариунаа", phone: "9911 2233", item: "svc:cut", staffId: "saraa", start: T(15), status: "pending", paid: 0 },
  { name: "Д. Мөнхзул", phone: "9955 8080", item: "svc:color", staffId: "saraa", start: T(16, 30), status: "confirmed", paid: 10000 },
  { name: "О. Гэрэлээ", phone: "8899 3030", item: "svc:cut", staffId: "saraa", start: T(18, 45), status: "pending", paid: 0 },

  { name: "Э. Номуун", phone: "9922 7171", item: "svc:lash", staffId: "nomin", start: T(10), status: "confirmed", paid: 10000 },
  { name: "С. Уянга", phone: "8811 6060", item: "svc:makeup", staffId: "nomin", start: T(12, 15), status: "no_show", paid: 0 },
  { name: "А. Дөлгөөн", phone: "9900 1818", item: "pkg:bride", staffId: "nomin", start: T(14), status: "confirmed", paid: 50000, locked: true, note: "Хурим 17:00-д — цагтаа дуусгах" },
  { name: "З. Марал", phone: "9977 2424", item: "svc:facial", staffId: "nomin", start: T(17, 30), status: "pending", paid: 0 },

  { name: "Ц. Сувдаа", phone: "8800 6543", item: "svc:mani", staffId: "bolor", start: T(10), status: "done", paid: 40000 },
  { name: "П. Оюука", phone: "9191 5252", item: "svc:nails", staffId: "bolor", start: T(11), status: "confirmed", paid: 0 },
  { name: "Н. Хулан", phone: "9911 4545", item: "svc:nails", staffId: "bolor", start: T(13, 30), status: "confirmed", paid: 0, groupId: "g-hulan" },
  { name: "С. Оюунаа", phone: "8811 4455", item: "svc:mani", staffId: "bolor", start: T(15), status: "pending", paid: 0 },
  { name: "Л. Саруул", phone: "9595 8686", item: "svc:nails", staffId: "bolor", start: T(16), status: "confirmed", paid: 10000 },
  { name: "М. Анужин", phone: "8888 0707", item: "svc:nails", staffId: "bolor", start: T(18), status: "pending", paid: 0 },

  { name: "Х. Золбоо", phone: "9696 1313", item: "svc:color", staffId: "temuulen", start: T(11), status: "confirmed", paid: 10000 },
  { name: "Д. Туяа", phone: "9393 2727", item: "svc:cut", staffId: "temuulen", start: T(13), status: "confirmed", paid: 0 },
  { name: "Б. Солонго", phone: "8686 4949", item: "svc:color", staffId: "temuulen", start: T(15, 30), status: "confirmed", paid: 10000, locked: true },
  { name: "Ж. Цэцгээ", phone: "9494 5151", item: "svc:cut", staffId: "temuulen", start: T(18), status: "pending", paid: 0 },
];

/**
 * Бусад өдрүүдийг дүүргэнэ. Ойрын өдрүүд дүүрэн, хол ирээдүй сул — жинхэнэ
 * салоны хуанли шиг. Өнгөрсөн өдрүүд ихэнхдээ "дууссан".
 */
function generateDay(
  day: number,
  m: DemoStaff,
  weekday: number,
  next: () => string,
): Omit<DemoBooking, "id" | "code">[] {
  const branch = branches.find((b) => b.id === m.branchId)!;
  if (branch.closedDays.includes(weekday)) return [];

  const rand = seeded(day * 97 + m.id.length * 13 + m.id.charCodeAt(0));
  const weekend = weekday === 5 || weekday === 6;
  const fill =
    day < 0 ? 0.72 : day <= 2 ? 0.66 : day <= 7 ? 0.5 : Math.max(0.12, 0.42 - day * 0.012);
  const load = Math.min(0.9, fill + (weekend ? 0.14 : 0));

  const out: Omit<DemoBooking, "id" | "code">[] = [];
  let t = branch.openMin + (rand() < 0.5 ? 0 : 30);
  while (t < branch.closeMin) {
    if (rand() > load) {
      t += rand() < 0.5 ? 30 : 60;
      continue;
    }
    const svcId = m.serviceIds[Math.floor(rand() * m.serviceIds.length)];
    const svc = services.find((s) => s.id === svcId)!;
    if (t + svc.durationMin > branch.closeMin) break;

    // "Хүлээгдэж буй" нь дөнгөж онлайнаар орж ирсэн захиалга — ойрын хоёр
    // өдөрт л цөөн байна, эс тэгвэл самбарын тоо бодитой бус өндөр гарна.
    const r = rand();
    const pendingShare = day <= 0 ? 0.1 : day <= 2 ? 0.08 : 0;
    const status: Status =
      day < 0
        ? r < 0.06 ? "cancelled" : r < 0.11 ? "no_show" : "done"
        : r < 0.05 ? "cancelled" : r < 0.05 + pendingShare ? "pending" : "confirmed";
    out.push({
      name: next(),
      phone: `${88 + Math.floor(rand() * 12)}${String(Math.floor(rand() * 100)).padStart(2, "0")} ${String(Math.floor(rand() * 10000)).padStart(4, "0")}`,
      item: `svc:${svcId}`,
      staffId: m.id,
      day,
      start: t,
      status,
      paid: status === "done" ? svc.price : status === "confirmed" && rand() < 0.45 ? 10000 : 0,
      locked: rand() < 0.12,
    });
    t += svc.durationMin + (rand() < 0.35 ? 15 : 0);
  }
  return out;
}

/**
 * Demo нээгдэх үеийн бүх захиалга. Өнөөдрийн хуваарийг цагтай нь тааруулна:
 * аль хэдийн өнгөрсөн нь "дууссан", хараахан болоогүй нь "баталгаажсан" —
 * ингэснээр "яг одоо" шугамын дээд, доод тал утга учиртай харагдана.
 */
export function createBookings(today: Date, nowMin: number): DemoBooking[] {
  const nameRand = seeded(7);
  const next = () =>
    `${INITIAL[Math.floor(nameRand() * INITIAL.length)]}. ${FIRST[Math.floor(nameRand() * FIRST.length)]}`;

  const raw: Omit<DemoBooking, "id" | "code">[] = [];
  for (let day = -7; day <= 34; day++) {
    const weekday = dateOf(today, day).getDay();
    for (const m of staff) {
      if (day === 0 && m.branchId === "center") continue;
      raw.push(...generateDay(day, m, weekday, next));
    }
  }
  raw.push(...TODAY_CENTER.map((b) => ({ ...b, day: 0 })));

  return raw
    .sort((a, b) => a.day - b.day || a.start - b.start)
    .map((b, i) => {
      let status = b.status;
      if (b.day === 0 && status !== "cancelled" && status !== "pending") {
        const ended = b.start + itemInfo(b.item).durationMin <= nowMin;
        if (ended && status === "confirmed") status = "done";
        if (!ended && (status === "done" || status === "no_show")) status = "confirmed";
      }
      const price = itemInfo(b.item).price;
      return {
        ...b,
        status,
        paid: status === "done" ? price : Math.min(b.paid, price),
        id: `b${i + 1}`,
        code: `LM-${4100 + i}`,
      };
    });
}

/** "Шинэ захиалга ирүүлж үзэх" — онлайнаар орж ирэх жишээ үйлчлүүлэгчид. */
export const incoming = [
  { name: "Х. Золжаргал", phone: "9977 1212", item: "svc:makeup" },
  { name: "Ц. Сувд-Эрдэнэ", phone: "8800 6544", item: "svc:nails" },
  { name: "Ө. Тэмүүлэн", phone: "9911 0099", item: "svc:cut" },
  { name: "Б. Мөнхчимэг", phone: "9595 3434", item: "svc:color" },
];

export const reviews = [
  { id: "r1", name: "Б. Сарнай", rating: 5, text: "Сараа маань үсийг минь яг хүссэнээр минь будсан. Онлайнаар цаг авах маш амар.", visible: true },
  { id: "r2", name: "Э. Номуун", rating: 5, text: "Сормуус маань 3 долоо хоног болсон ч гоё хэвээрээ. Орчин нь тухтай.", visible: true },
  { id: "r3", name: "П. Оюука", rating: 4, text: "Хумс их цэвэрхэн хийсэн. Жаахан хүлээсэн ч үр дүн нь гоё.", visible: true },
  { id: "r4", name: "Д. Мөнхзул", rating: 5, text: "Утсаар ярихгүйгээр шөнө ч захиалчихдаг нь их таалагдсан.", visible: false },
];
