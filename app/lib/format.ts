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
