/**
 * Салоны цагийн бүсийн тооцоо.
 *
 * Сервер хаана ажиллаж байгаагаас (Vercel дээр UTC, таны Mac дээр +08)
 * хамааралгүйгээр бүх огноо/цагийг ҮРГЭЛЖ салоны цагаар бодно. Эс тэгвэл
 * UTC сервер УБ-ын 16:00 цагийг 08:00 гэж үзээд аль хэдийн өнгөрсөн цагийг
 * "сул байна" гэж санал болгоно.
 *
 * Клиент, сервер хоёуланд ажиллана — зөвхөн Intl API ашиглана.
 */
export const SALON_TIMEZONE = "Asia/Ulaanbaatar";

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

function partsInZone(instant: Date): Parts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    // Зарим хөтөч шөнө дундыг "24" гэж буцаадаг тул 24 -> 0 болгоно.
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
  };
}

/** Салоны цагаар яг одоо хэдэн он сар өдөр вэ. "2026-07-20" */
export function salonToday(): string {
  const p = partsInZone(new Date());
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Салоны цагаар шөнө дунднаас хойш өнгөрсөн минут (16:30 -> 990). */
export function salonNowMinutes(): number {
  const p = partsInZone(new Date());
  return p.hour * 60 + p.minute;
}

/**
 * Салоны цагаарх огноо+цагийг дэлхийн цаг дээрх мөч (epoch ms) болгоно.
 * Ж: ("2026-07-20", "14:00") -> УБ-ын 14:00 цагт харгалзах мөч.
 */
export function salonInstant(dateISO: string, hhmm: string): number {
  const naive = Date.parse(`${dateISO}T${hhmm}:00Z`);
  if (Number.isNaN(naive)) return NaN;

  // Тухайн мөч дэх бүсийн зөрүүг олоод хасна. Монгол зуны цаггүй ч
  // хоёр дахин шалгаснаар бүсийн дүрэм өөрчлөгдсөн ч зөв ажиллана.
  const offsetAt = (ts: number) => {
    const p = partsInZone(new Date(ts));
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - ts) / 60000;
  };
  const first = offsetAt(naive);
  const guess = naive - first * 60000;
  const second = offsetAt(guess);
  return second === first ? guess : naive - second * 60000;
}
