export function formatPrice(mnt: number): string {
  return new Intl.NumberFormat("mn-MN").format(mnt) + "₮";
}

/** Хямдралын хувийг 0–90 хооронд цэгцлэнэ. */
export function normalizeSalePercent(v: number): number {
  const n = Math.round(Number(v) || 0);
  return Math.min(90, Math.max(0, n));
}

/**
 * Үйлчилгээний бодит төлөх үнэ — хямдрал байвал түүнийг тооцсон, ойролцоох
 * 100₮ рүү дугуйрсан дүн. Хямдралгүй бол жирийн үнээ буцаана.
 */
export function effectivePrice(service: {
  price: number;
  salePercent?: number;
}): number {
  const pct = normalizeSalePercent(service.salePercent ?? 0);
  if (!pct) return service.price;
  return Math.round((service.price * (100 - pct)) / 100 / 100) * 100;
}

/** Хямдрал идэвхтэй эсэх (хувь тавьсан бөгөөд үнийг үнэхээр бууруулж байгаа). */
export function hasSale(service: { price: number; salePercent?: number }): boolean {
  return normalizeSalePercent(service.salePercent ?? 0) > 0 &&
    effectivePrice(service) < service.price;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}ц ${m}мин` : `${h} цаг`;
}

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

/** "2026-07-09" -> "7-р сар 9, Пүрэв" */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${WEEKDAYS[d.getDay()]}`;
}

/** "47.9185,106.9177" хэлбэртэй текстийг таньж цэгцэлнэ. Таарахгүй бол null. */
export function parseCoords(value: string): string | null {
  const m = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;

  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `${lat},${lng}`;
}

/**
 * "47.9185,106.9177" -> OpenStreetMap-ийн embed хаяг. Буруу эсвэл хоосон
 * утга орж ирвэл null буцаана — дуудаж буй тал газрын зургийг нуух ёстой.
 */
export function mapEmbedUrl(coords: string): string | null {
  const parsed = parseCoords(coords);
  if (!parsed) return null;

  const [lat, lng] = parsed.split(",").map(Number);

  const bbox = [lng - 0.012, lat - 0.005, lng + 0.012, lat + 0.005]
    .map((n) => n.toFixed(4))
    .join(",");
  return (
    `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}` +
    `&layer=mapnik&marker=${lat},${lng}`
  );
}

// Долоо хоногийг Даваагаар эхлүүлж дараална (JS-д 0=Ням).
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** [1,2,3,5] -> "Даваа–Лхагва, Баасан" */
function groupWeekdays(days: number[]): string {
  if (days.length === 0) return "";
  if (days.length === 7) return "Өдөр бүр";

  const pos = (d: number) => WEEK_ORDER.indexOf(d);
  const runs: number[][] = [];
  for (const d of days) {
    const last = runs[runs.length - 1];
    if (last && pos(d) === pos(last[last.length - 1]) + 1) last.push(d);
    else runs.push([d]);
  }

  return runs
    .map((r) =>
      r.length === 1
        ? WEEKDAYS[r[0]]
        : r.length === 2
          ? `${WEEKDAYS[r[0]]}, ${WEEKDAYS[r[1]]}`
          : `${WEEKDAYS[r[0]]}–${WEEKDAYS[r[r.length - 1]]}`,
    )
    .join(", ");
}

/**
 * Харагдах ажлын цагийг захиалгын хөдөлгүүрийн ашигладаг яг тэр тохиргооноос
 * гаргана — ингэснээр сайт дээр бичсэн цаг захиалгын боломжтой цагтай үргэлж
 * тохирно.
 */
export function formatHours(settings: {
  openTime: string;
  closeTime: string;
  closedDays: number[];
}): { days: string; hours: string; closedDays: string } {
  const closed = new Set(settings.closedDays);
  return {
    days: groupWeekdays(WEEK_ORDER.filter((d) => !closed.has(d))),
    hours: `${settings.openTime}–${settings.closeTime}`,
    closedDays: groupWeekdays(WEEK_ORDER.filter((d) => closed.has(d))),
  };
}
